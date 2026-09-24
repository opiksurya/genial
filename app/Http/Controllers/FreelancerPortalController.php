<?php

namespace App\Http\Controllers;

use App\Models\Freelancer;
use App\Models\FreelancerAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FreelancerPortalController extends Controller
{
    public function index(string $access_token): Response
    {
        $freelancer = Freelancer::where('access_token', $access_token)->firstOrFail();

        $assignments = FreelancerAssignment::with(['project', 'task'])
            ->where('freelancer_id', $freelancer->id)
            ->latest()
            ->get();

        $totalEarnings = (float) $assignments->sum('fee_amount');
        $paidEarnings = (float) $assignments->where('payment_status', 'paid')->sum('fee_amount');
        $unpaidEarnings = (float) $assignments->where('payment_status', 'unpaid')->sum('fee_amount');

        $activeJobs = $assignments->whereIn('status', ['assigned', 'in_progress', 'submitted', 'revision'])->count();
        $completedJobs = $assignments->where('status', 'completed')->count();

        return Inertia::render('freelancer/portal', [
            'freelancer' => $freelancer,
            'assignments' => $assignments,
            'stats' => [
                'total_earnings' => $totalEarnings,
                'paid_earnings' => $paidEarnings,
                'unpaid_earnings' => $unpaidEarnings,
                'active_jobs' => $activeJobs,
                'completed_jobs' => $completedJobs,
            ],
        ]);
    }

    public function submitWork(Request $request, string $access_token, FreelancerAssignment $assignment)
    {
        $freelancer = Freelancer::where('access_token', $access_token)->firstOrFail();

        if ($assignment->freelancer_id !== $freelancer->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'submission_link' => 'required|url|max:500',
            'notes' => 'nullable|string',
        ]);

        $assignment->update([
            'submission_link' => $validated['submission_link'],
            'status' => 'submitted',
            'notes' => $validated['notes'] ?? $assignment->notes,
        ]);

        return redirect()->back()->with('success', 'Hasil pekerjaan berhasil disubmit ke tim Genial! Menunggu review/approval.');
    }

    public function updateStatus(Request $request, string $access_token, FreelancerAssignment $assignment)
    {
        $freelancer = Freelancer::where('access_token', $access_token)->firstOrFail();

        if ($assignment->freelancer_id !== $freelancer->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'status' => 'required|in:assigned,in_progress,submitted,revision,completed',
        ]);

        $assignment->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Status progress pekerjaan diperbarui!');
    }
}
