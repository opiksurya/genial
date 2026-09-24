<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Freelancer;
use App\Models\FreelancerAssignment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FreelancerController extends Controller
{
    public function index(Request $request): Response
    {
        $freelancers = Freelancer::with(['assignments.project'])
            ->withCount([
                'assignments as total_assignments',
                'assignments as active_assignments' => function ($query) {
                    $query->whereIn('status', ['assigned', 'in_progress', 'submitted', 'revision']);
                },
                'assignments as completed_assignments' => function ($query) {
                    $query->where('status', 'completed');
                },
            ])
            ->withSum('assignments as total_earnings', 'fee_amount')
            ->withSum(['assignments as paid_earnings' => function ($query) {
                $query->where('payment_status', 'paid');
            }], 'fee_amount')
            ->withSum(['assignments as unpaid_earnings' => function ($query) {
                $query->where('payment_status', 'unpaid');
            }], 'fee_amount')
            ->latest()
            ->get();

        $assignments = FreelancerAssignment::with(['freelancer', 'project', 'task'])
            ->latest()
            ->get();

        $projects = Project::select('id', 'name', 'client', 'category', 'status')
            ->orderBy('name')
            ->get();

        $tasks = Task::select('id', 'title', 'project_id', 'status')
            ->latest()
            ->limit(100)
            ->get();

        $stats = [
            'total_freelancers' => $freelancers->count(),
            'active_freelancers' => $freelancers->where('status', 'active')->count(),
            'total_jobs' => $assignments->count(),
            'active_jobs' => $assignments->whereIn('status', ['assigned', 'in_progress', 'submitted', 'revision'])->count(),
            'completed_jobs' => $assignments->where('status', 'completed')->count(),
            'total_fees' => (float) $assignments->sum('fee_amount'),
            'paid_fees' => (float) $assignments->where('payment_status', 'paid')->sum('fee_amount'),
            'unpaid_fees' => (float) $assignments->where('payment_status', 'unpaid')->sum('fee_amount'),
        ];

        return Inertia::render('freelancers/index', [
            'freelancers' => $freelancers,
            'assignments' => $assignments,
            'projects' => $projects,
            'tasks' => $tasks,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'portfolio_link' => 'nullable|string|max:255',
            'rate_per_project' => 'nullable|numeric|min:0',
            'rate_unit' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        $validated['access_token'] = Str::random(48);

        $freelancer = Freelancer::create($validated);

        return redirect()->back()->with('success', "Freelancer {$freelancer->name} berhasil ditambahkan!");
    }

    public function update(Request $request, Freelancer $freelancer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'portfolio_link' => 'nullable|string|max:255',
            'rate_per_project' => 'nullable|numeric|min:0',
            'rate_unit' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        $freelancer->update($validated);

        return redirect()->back()->with('success', "Data Freelancer {$freelancer->name} berhasil diperbarui!");
    }

    public function destroy(Freelancer $freelancer)
    {
        $name = $freelancer->name;
        $freelancer->delete();

        return redirect()->back()->with('success', "Freelancer {$name} berhasil dihapus.");
    }

    public function regenerateToken(Freelancer $freelancer)
    {
        $freelancer->update([
            'access_token' => Str::random(48),
        ]);

        return redirect()->back()->with('success', "Magic Portal Link untuk {$freelancer->name} berhasil diperbarui!");
    }

    public function storeAssignment(Request $request)
    {
        $validated = $request->validate([
            'freelancer_id' => 'required|exists:freelancers,id',
            'project_id' => 'nullable|exists:projects,id',
            'task_id' => 'nullable|exists:tasks,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'brief_link' => 'nullable|string|max:500',
            'fee_amount' => 'required|numeric|min:0',
            'deadline' => 'nullable|date',
            'status' => 'required|in:assigned,in_progress,submitted,revision,completed',
            'payment_status' => 'required|in:unpaid,paid',
            'notes' => 'nullable|string',
        ]);

        $assignment = FreelancerAssignment::create($validated);

        return redirect()->back()->with('success', "Penugasan job \"{$assignment->title}\" berhasil dibuat!");
    }

    public function updateAssignment(Request $request, FreelancerAssignment $assignment)
    {
        $validated = $request->validate([
            'freelancer_id' => 'required|exists:freelancers,id',
            'project_id' => 'nullable|exists:projects,id',
            'task_id' => 'nullable|exists:tasks,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'brief_link' => 'nullable|string|max:500',
            'submission_link' => 'nullable|string|max:500',
            'fee_amount' => 'required|numeric|min:0',
            'deadline' => 'nullable|date',
            'status' => 'required|in:assigned,in_progress,submitted,revision,completed',
            'payment_status' => 'required|in:unpaid,paid',
            'notes' => 'nullable|string',
        ]);

        if ($validated['payment_status'] === 'paid' && $assignment->payment_status !== 'paid') {
            $validated['paid_at'] = now();
        } elseif ($validated['payment_status'] === 'unpaid') {
            $validated['paid_at'] = null;
        }

        $assignment->update($validated);

        return redirect()->back()->with('success', "Penugasan \"{$assignment->title}\" berhasil diupdate!");
    }

    public function payAssignment(Request $request, FreelancerAssignment $assignment)
    {
        $status = $request->input('status', 'paid');
        $recordExpense = (bool) $request->input('record_expense', true);

        $assignment->update([
            'payment_status' => $status,
            'paid_at' => $status === 'paid' ? now() : null,
        ]);

        // Auto record into Expense in FinanceFlow if requested and paid
        if ($status === 'paid' && $recordExpense && !$assignment->expense_id) {
            $expense = Expense::create([
                'project_id' => $assignment->project_id,
                'name' => "[Freelancer] Fee {$assignment->freelancer->name} - {$assignment->title}",
                'category' => 'Freelancer',
                'amount' => $assignment->fee_amount,
                'date' => now()->toDateString(),
                'status' => 'Approved',
                'description' => "Pembayaran honorarium job freelancer {$assignment->freelancer->name} ({$assignment->freelancer->role}) untuk project " . ($assignment->project?->name ?? 'General'),
                'created_by' => auth()->id(),
            ]);

            $assignment->update(['expense_id' => $expense->id]);
        }

        $textStatus = $status === 'paid' ? 'LUNAS (Paid)' : 'PENDING (Unpaid)';
        return redirect()->back()->with('success', "Status honorarium \"{$assignment->title}\" Rp " . number_format($assignment->fee_amount, 0, ',', '.') . " diubah menjadi {$textStatus}!");
    }

    public function destroyAssignment(FreelancerAssignment $assignment)
    {
        $title = $assignment->title;
        $assignment->delete();

        return redirect()->back()->with('success', "Penugasan job \"{$title}\" berhasil dihapus.");
    }
}
