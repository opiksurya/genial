<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Task;
use App\Models\User;
use App\Services\ClientPortal\ClientScope;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only ProjectFlow view for Client/Reviewer accounts.
 *
 * Deliberately separate from the internal ProjectFlow controllers: every field
 * sent to the browser is listed here, so credentials, task descriptions, links,
 * comments, agent commission and other users' emails can never leak.
 */
class ProjectFlowController extends Controller
{
    public function index(Request $request): Response
    {
        return $this->render($request, 'dashboard');
    }

    public function board(Request $request): Response
    {
        return $this->render($request, 'board');
    }

    public function timeline(Request $request): Response
    {
        return $this->render($request, 'timeline');
    }

    public function team(Request $request): Response
    {
        return $this->render($request, 'team');
    }

    public function reports(Request $request): Response
    {
        return $this->render($request, 'reports');
    }

    private function render(Request $request, string $view): Response
    {
        $scope = ClientScope::for($request);
        $projectIds = $scope->projectIds();
        $today = now()->toDateString();

        $projects = [];
        foreach (Project::query()->whereIn('id', $projectIds)->with('manager:id,name')->orderBy('name')->get() as $project) {
            $projects[] = [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'progress' => $project->progress,
                'start_date' => $this->day($project->start_date),
                'end_date' => $this->day($project->end_date),
                'manager' => $project->manager instanceof User ? $project->manager->name : null,
            ];
        }

        $tasks = [];
        foreach (Task::query()->whereIn('project_id', $projectIds)->with('assignee:id,name')->orderBy('order')->get() as $task) {
            $due = $this->day($task->due_date);

            $tasks[] = [
                'id' => $task->id,
                'project_id' => $task->project_id,
                'title' => $task->title,
                'status' => $task->status,
                'priority' => $task->priority,
                'label' => $task->label,
                'assignee' => $task->assignee instanceof User ? $task->assignee->name : null,
                'start_date' => $this->day($task->start_date),
                'due_date' => $due,
                'is_overdue' => $task->status !== 'DONE' && $due !== null && $due < $today,
            ];
        }

        $milestones = [];
        foreach (Milestone::query()->whereIn('project_id', $projectIds)->orderBy('due_date')->get() as $milestone) {
            $milestones[] = [
                'id' => $milestone->id,
                'project_id' => $milestone->project_id,
                'title' => $milestone->title,
                'due_date' => $this->day($milestone->due_date),
                'is_completed' => (bool) $milestone->is_completed,
            ];
        }

        $team = [];
        foreach (ProjectMember::query()->whereIn('project_id', $projectIds)->with('user:id,name')->get() as $member) {
            if (! $member->user instanceof User) {
                continue;
            }

            $team[] = [
                'id' => $member->id,
                'project_id' => $member->project_id,
                'name' => $member->user->name,
                'role' => $member->role,
            ];
        }

        $projectOptions = [];
        foreach ($scope->projects() as $project) {
            $projectOptions[] = ['id' => $project->id, 'name' => $project->name];
        }

        $taskCollection = collect($tasks);

        $performance = [];
        foreach ($projects as $project) {
            $own = $taskCollection->where('project_id', $project['id']);
            $total = $own->count();
            $done = $own->where('status', 'DONE')->count();

            $performance[] = [
                'project_id' => $project['id'],
                'name' => $project['name'],
                'total' => $total,
                'done' => $done,
                'delayed' => $own->where('is_overdue', true)->count(),
                'rate' => $total > 0 ? (int) round($done / $total * 100) : 0,
            ];
        }

        return Inertia::render('client/projectflow', [
            'view' => $view,
            'performance' => $performance,
            'projects' => $projectOptions,
            'selectedProjectId' => $scope->selectedProjectId(),
            'projectDetails' => $projects,
            'tasks' => $tasks,
            'milestones' => $milestones,
            'team' => $team,
            'stats' => [
                'total' => count($tasks),
                'done' => $taskCollection->where('status', 'DONE')->count(),
                'in_progress' => $taskCollection->where('status', 'IN_PROGRESS')->count(),
                'overdue' => $taskCollection->where('is_overdue', true)->count(),
            ],
        ]);
    }

    private function day(mixed $value): ?string
    {
        return $value instanceof CarbonInterface ? $value->toDateString() : null;
    }
}
