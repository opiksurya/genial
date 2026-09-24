<?php

namespace App\Http\Controllers;

use App\Models\ContentPlan;
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

        $contentPlans = ContentPlan::with('project')
            ->where('freelancer_id', $freelancer->id)
            ->orderBy('scheduled_date', 'desc')
            ->get();

        $assignmentTotal = (float) $assignments->sum('fee_amount');
        $assignmentPaid = (float) $assignments->where('payment_status', 'paid')->sum('fee_amount');
        $assignmentUnpaid = (float) $assignments->where('payment_status', '!=', 'paid')->sum('fee_amount');

        $contentTotal = (float) $contentPlans->sum('freelancer_fee');
        $contentPaid = (float) $contentPlans->where('payout_status', 'paid')->sum('freelancer_fee');
        $contentApproved = (float) $contentPlans->where('payout_status', 'approved')->sum('freelancer_fee');
        $contentUnpaid = (float) $contentPlans->where('payout_status', 'unpaid')->sum('freelancer_fee');

        $totalEarnings = $assignmentTotal + $contentTotal;
        $paidEarnings = $assignmentPaid + $contentPaid;
        $approvedPendingEarnings = $contentApproved;
        $unpaidEarnings = $assignmentUnpaid + $contentUnpaid;

        $activeContentCount = $contentPlans->whereIn('freelancer_status', ['assigned', 'in_progress', 'submitted', 'revision'])->count();
        $completedContentCount = $contentPlans->whereIn('freelancer_status', ['approved'])->count();

        $activeJobs = $assignments->whereIn('status', ['assigned', 'in_progress', 'submitted', 'revision'])->count() + $activeContentCount;
        $completedJobs = $assignments->where('status', 'completed')->count() + $completedContentCount;

        return Inertia::render('freelancer/portal', [
            'freelancer' => $freelancer,
            'assignments' => $assignments,
            'contentPlans' => $contentPlans,
            'stats' => [
                'total_earnings' => $totalEarnings,
                'paid_earnings' => $paidEarnings,
                'approved_pending_earnings' => $approvedPendingEarnings,
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

        return redirect()->back()->with('success', 'Hasil pekerjaan berhasil disubmit ke tim Genial! Menunggu review/ACC admin.');
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

    public function submitContentWork(Request $request, string $access_token, ContentPlan $contentPlan)
    {
        $freelancer = Freelancer::where('access_token', $access_token)->firstOrFail();

        if ($contentPlan->freelancer_id !== $freelancer->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'submission_link' => 'required|url|max:500',
            'freelancer_notes' => 'nullable|string',
        ]);

        $contentPlan->update([
            'submission_link' => $validated['submission_link'],
            'freelancer_notes' => $validated['freelancer_notes'] ?? $contentPlan->freelancer_notes,
            'freelancer_status' => 'submitted',
        ]);

        return redirect()->back()->with('success', 'Hasil konten (' . $contentPlan->platform . ' - ' . $contentPlan->format . ') berhasil disubmit! Menunggu ACC & verifikasi admin.');
    }

    public function updateContentStatus(Request $request, string $access_token, ContentPlan $contentPlan)
    {
        $freelancer = Freelancer::where('access_token', $access_token)->firstOrFail();

        if ($contentPlan->freelancer_id !== $freelancer->id) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'status' => 'required|in:assigned,in_progress,submitted,revision,approved',
        ]);

        $contentPlan->update([
            'freelancer_status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Status konten diperbarui!');
    }
}
