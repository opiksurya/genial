<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectTimelineController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedProjectId = $request->query('project_id');

        $projects = Project::with(['manager', 'milestones'])->latest()->get();

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
