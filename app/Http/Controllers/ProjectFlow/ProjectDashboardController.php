<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectDashboardController extends Controller
{
    public function index(): Response
    {
        $today = now()->format('Y-m-d');

        $activeProjects = Project::where('status', 'In Progress')->count();
        $completedProjects = Project::where('status', 'Completed')->count();
        $overdueProjects = Project::where('status', '!=', 'Completed')
            ->where('end_date', '<', $today)
            ->count();

        $pendingTasks = Task::where('status', '!=', 'DONE')->count();
        $todayTasks = Task::whereDate('due_date', $today)->count();
        $upcomingDeadlines = Task::with(['project', 'assignee'])
            ->where('status', '!=', 'DONE')
            ->whereBetween('due_date', [$today, now()->addDays(7)->format('Y-m-d')])
            ->orderBy('due_date', 'asc')
            ->take(6)
            ->get();

        $projects = Project::with(['manager', 'tasks', 'members.user'])
            ->latest()
            ->get()
            ->map(function ($p) {
                $p->tasks_count = $p->tasks->count();
                $p->completed_tasks_count = $p->tasks->where('status', 'DONE')->count();
                $p->is_overdue = $p->status !== 'Completed' && $p->end_date < now()->format('Y-m-d');
                return $p;
            });

        return Inertia::render('projects/dashboard', [
            'stats' => [
                'active_projects' => $activeProjects,
                'completed_projects' => $completedProjects,
                'overdue_projects' => $overdueProjects,
                'pending_tasks' => $pendingTasks,
                'today_tasks' => $todayTasks,
            ],
            'projects' => $projects,
            'upcomingDeadlines' => $upcomingDeadlines,
        ]);
    }
}
