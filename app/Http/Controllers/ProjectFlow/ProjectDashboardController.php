<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\ProjectMember;

class ProjectDashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $today = now()->format('Y-m-d');

        $projectQuery = Project::query();
        $taskQuery = Task::query();

        if ($user && $user->hasRole('Client')) {
            $userProjectIds = ProjectMember::where('user_id', $user->id)->pluck('project_id');
            $projectQuery->whereIn('id', $userProjectIds);
            $taskQuery->whereIn('project_id', $userProjectIds);
        }

        $activeProjects = (clone $projectQuery)->where('status', 'In Progress')->count();
        $completedProjects = (clone $projectQuery)->where('status', 'Completed')->count();
        $overdueProjects = (clone $projectQuery)->where('status', '!=', 'Completed')
            ->where('end_date', '<', $today)
            ->count();

        $pendingTasks = (clone $taskQuery)->where('status', '!=', 'DONE')->count();
        $todayTasks = (clone $taskQuery)->whereDate('due_date', $today)->count();
        
        $upcomingDeadlinesQuery = Task::with(['project', 'assignee'])
            ->where('status', '!=', 'DONE')
            ->whereBetween('due_date', [$today, now()->addDays(7)->format('Y-m-d')]);

        if ($user && $user->hasRole('Client')) {
            $upcomingDeadlinesQuery->whereIn('project_id', $userProjectIds);
        }

        $upcomingDeadlines = $upcomingDeadlinesQuery
            ->orderBy('due_date', 'asc')
            ->take(6)
            ->get();

        $projectsQueryWithRelations = Project::with(['manager', 'tasks', 'members.user']);
        if ($user && $user->hasRole('Client')) {
            $projectsQueryWithRelations->whereIn('id', $userProjectIds);
        }

        $projects = $projectsQueryWithRelations
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
