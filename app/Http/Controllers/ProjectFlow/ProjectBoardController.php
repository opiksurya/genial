<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Task;
use App\Models\TaskChecklist;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectBoardController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedProjectId = $request->query('project_id');

        $projects = Project::with(['manager', 'members.user', 'credentials'])->latest()->get();

        if (!$selectedProjectId && $projects->isNotEmpty()) {
            $selectedProjectId = $projects->first()->id;
        }

        $activeProject = $selectedProjectId
            ? Project::with(['manager', 'members.user', 'milestones', 'credentials'])->find($selectedProjectId)
            : null;


        $tasks = $activeProject
            ? Task::with(['assignee', 'comments.user', 'checklists', 'dependencies'])
                ->where('project_id', $activeProject->id)
                ->orderBy('order', 'asc')
                ->get()
                ->map(function ($task) {
                    $task->duration_days = $task->duration_days;
                    return $task;
                })
            : collect([]);

        $users = User::select('id', 'name', 'email', 'avatar')->get();

        return Inertia::render('projects/board', [
            'projects' => $projects,
            'activeProject' => $activeProject,
            'tasks' => $tasks,
            'users' => $users,
        ]);
    }

    public function storeProject(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client' => 'required|string|max:255',
            'client_logo' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'priority' => 'required|string',
            'manager_id' => 'nullable|exists:users,id',
            'is_show_on_home' => 'nullable|boolean',
            'members' => 'nullable|array',
            'members.*.user_id' => 'required|exists:users,id',
            'members.*.role' => 'required|string',
        ]);

        $project = Project::create([
            'name' => $validated['name'],
            'client' => $validated['client'],
            'client_logo' => $validated['client_logo'] ?? null,
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'status' => 'Planning',
            'priority' => $validated['priority'],
            'progress' => 0,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'manager_id' => $validated['manager_id'] ?? auth()->id(),
            'is_show_on_home' => $validated['is_show_on_home'] ?? true,
        ]);


        if (!empty($validated['members'])) {
            foreach ($validated['members'] as $mem) {
                ProjectMember::create([
                    'project_id' => $project->id,
                    'user_id' => $mem['user_id'],
                    'role' => $mem['role'],
                ]);
            }
        }

        return redirect()->route('projects.board', ['project_id' => $project->id])
            ->with('success', 'Project baru "' . $project->name . '" berhasil dibuat!');
    }

    public function storeTask(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string',
            'priority' => 'required|string',
            'label' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
            'assignee_role' => 'nullable|string',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
        ]);

        $maxOrder = Task::where('project_id', $validated['project_id'])
            ->where('status', $validated['status'])
            ->max('order') ?? 0;

        $task = Task::create([
            'project_id' => $validated['project_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'label' => $validated['label'] ?? null,
            'assignee_id' => $validated['assignee_id'] ?? null,
            'assignee_role' => $validated['assignee_role'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'order' => $maxOrder + 1,
        ]);

        $project = Project::find($validated['project_id']);
        if ($project) {
            $project->recalculateProgress();
        }

        return redirect()->back()->with('success', 'Task "' . $task->title . '" berhasil dibuat!');
    }

    public function updateTaskStatus(Request $request, Task $task)
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'order' => 'nullable|integer',
        ]);

        $task->update([
            'status' => $validated['status'],
            'order' => $validated['order'] ?? $task->order,
        ]);

        $task->project->recalculateProgress();

        return redirect()->back()->with('success', 'Status task berhasil diperbarui!');
    }

    public function storeComment(Request $request, Task $task)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        TaskComment::create([
            'task_id' => $task->id,
            'user_id' => auth()->id(),
            'comment' => $validated['comment'],
        ]);

        return redirect()->back()->with('success', 'Komentar berhasil ditambahkan!');
    }

    public function toggleChecklist(TaskChecklist $checklist)
    {
        $checklist->update([
            'is_completed' => !$checklist->is_completed,
        ]);

        return redirect()->back();
    }

    public function toggleHomeVisibility(Project $project)
    {
        $project->update([
            'is_show_on_home' => !$project->is_show_on_home,
        ]);

        $statusText = $project->is_show_on_home ? 'ditampilkan di' : 'disembunyikan dari';
        return redirect()->back()->with('success', 'Project "' . $project->name . '" berhasil ' . $statusText . ' Home Page!');
    }
}
