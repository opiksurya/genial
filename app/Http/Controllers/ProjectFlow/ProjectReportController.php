<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectReportController extends Controller
{
    public function index(): Response
    {
        $today = now()->format('Y-m-d');

        $totalTasks = Task::count();
        $completedTasks = Task::where('status', 'DONE')->count();
        $delayedTasks = Task::where('status', '!=', 'DONE')
            ->where('due_date', '<', $today)
            ->count();
        $inProgressTasks = Task::where('status', 'IN_PROGRESS')->count();

        $overallCompletionRate = $totalTasks > 0 ? (int) round(($completedTasks / $totalTasks) * 100) : 0;

        $projectPerformance = Project::with(['tasks'])
            ->get()
            ->map(function ($p) use ($today) {
                $total = $p->tasks->count();
                $done = $p->tasks->where('status', 'DONE')->count();
                $delayed = $p->tasks->where('status', '!=', 'DONE')->where('due_date', '<', $today)->count();
                $p->total_tasks = $total;
                $p->done_tasks = $done;
                $p->delayed_tasks = $delayed;
                $p->completion_rate = $total > 0 ? (int) round(($done / $total) * 100) : 0;
                return $p;
            });

        return Inertia::render('projects/reports', [
            'metrics' => [
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'delayed_tasks' => $delayedTasks,
                'in_progress_tasks' => $inProgressTasks,
                'overall_completion_rate' => $overallCompletionRate,
            ],
            'projectPerformance' => $projectPerformance,
        ]);
    }
}
