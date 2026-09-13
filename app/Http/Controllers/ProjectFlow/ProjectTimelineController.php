<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use App\Models\ProjectMember;

class ProjectTimelineController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $selectedProjectId = $request->query('project_id');

        $projectsQuery = Project::with(['manager', 'milestones']);

        if ($user && $user->hasRole('Client')) {
            $userProjectIds = ProjectMember::where('user_id', $user->id)->pluck('project_id');
            $projectsQuery->whereIn('id', $userProjectIds);
        }

        $projects = $projectsQuery->latest()->get();

        if ($selectedProjectId && !$projects->pluck('id')->contains((int)$selectedProjectId)) {
            $selectedProjectId = null;
        }

        if (!$selectedProjectId && $projects->isNotEmpty()) {
            $selectedProjectId = $projects->first()->id;
        }

        $activeProject = $selectedProjectId ? Project::with(['milestones', 'manager'])->find($selectedProjectId) : null;

        $tasks = $activeProject
            ? Task::with(['assignee', 'dependencies.dependsOnTask'])
                ->where('project_id', $activeProject->id)
                ->orderBy('start_date', 'asc')
                ->get()
                ->map(function ($t) {
                    $t->duration_days = $t->duration_days;
                    return $t;
                })
            : collect([]);

        return Inertia::render('projects/timeline', [
            'projects' => $projects,
            'activeProject' => $activeProject,
            'tasks' => $tasks,
            'todayDate' => now()->format('Y-m-d'),
        ]);
    }
}
