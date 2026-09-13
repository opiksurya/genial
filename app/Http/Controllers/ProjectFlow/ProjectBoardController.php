<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Agent;
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

        $projects = Project::with(['manager', 'members.user', 'credentials', 'agent'])->latest()->get();

        if (!$selectedProjectId && $projects->isNotEmpty()) {
            $selectedProjectId = $projects->first()->id;
        }

        $activeProject = $selectedProjectId
            ? Project::with(['manager', 'members.user', 'milestones', 'credentials', 'agent'])->find($selectedProjectId)
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
        $agents = Agent::where('status', 'active')->select('id', 'name', 'commission_rate')->get();

        return Inertia::render('projects/board', [
            'projects' => $projects,
            'activeProject' => $activeProject,
            'tasks' => $tasks,
            'users' => $users,
            'agents' => $agents,
        ]);
    }

    public function storeProject(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client' => 'required|string|max:255',
            'client_logo' => 'nullable',
            'client_logo_file' => 'nullable|image|mimes:png,jpg,jpeg,svg,webp|max:3072',
            'slug' => 'nullable|string|max:255',
            'article_title' => 'nullable|string|max:255',
            'article_subtitle' => 'nullable|string',
            'article_content' => 'nullable|string',
            'initial_revenue' => 'nullable|string|max:255',
            'current_revenue' => 'nullable|string|max:255',
            'initial_roas' => 'nullable|string|max:255',
            'current_roas' => 'nullable|string|max:255',
            'growth_percentage' => 'nullable|string|max:255',
            'collaboration_story' => 'nullable|string',
            'key_results' => 'nullable|string',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'priority' => 'required|string',
            'manager_id' => 'nullable|exists:users,id',
            'agent_id' => 'nullable|exists:agents,id',
            'is_show_on_home' => 'nullable|boolean',
            'members' => 'nullable|array',
            'members.*.user_id' => 'required|exists:users,id',
            'members.*.role' => 'required|string',
        ]);

        $logoUrl = null;
        if ($request->hasFile('client_logo_file')) {
            $path = $request->file('client_logo_file')->store('client_logos', 'public');
            $logoUrl = '/storage/' . $path;
        } elseif ($request->hasFile('client_logo')) {
            $path = $request->file('client_logo')->store('client_logos', 'public');
            $logoUrl = '/storage/' . $path;
        } elseif (is_string($request->input('client_logo'))) {
            $logoUrl = $request->input('client_logo');
        }

        $projectData = [
            'name' => $validated['name'],
            'client' => $validated['client'],
            'client_logo' => $logoUrl,
            'slug' => $validated['slug'] ?? null,
            'article_title' => $validated['article_title'] ?? null,
            'article_subtitle' => $validated['article_subtitle'] ?? null,
            'article_content' => $validated['article_content'] ?? null,
            'initial_revenue' => $validated['initial_revenue'] ?? null,
            'current_revenue' => $validated['current_revenue'] ?? null,
            'initial_roas' => $validated['initial_roas'] ?? null,
            'current_roas' => $validated['current_roas'] ?? null,
            'growth_percentage' => $validated['growth_percentage'] ?? null,
            'collaboration_story' => $validated['collaboration_story'] ?? null,
            'key_results' => $validated['key_results'] ?? null,
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'status' => 'Planning',
            'priority' => $validated['priority'],
            'progress' => 0,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'manager_id' => $validated['manager_id'] ?? auth()->id(),
            'agent_id' => $validated['agent_id'] ?? null,
            'is_show_on_home' => $validated['is_show_on_home'] ?? true,
        ];

        $project = Project::create($projectData);


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

    public function updateProject(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client' => 'required|string|max:255',
            'client_logo' => 'nullable',
            'client_logo_file' => 'nullable|image|mimes:png,jpg,jpeg,svg,webp|max:3072',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'priority' => 'required|string',
            'manager_id' => 'nullable|exists:users,id',
            'agent_id' => 'nullable|exists:agents,id',
            'is_show_on_home' => 'nullable|boolean',
        ]);

        if ($request->hasFile('client_logo_file')) {
            $path = $request->file('client_logo_file')->store('client_logos', 'public');
            $validated['client_logo'] = '/storage/' . $path;
        } elseif ($request->hasFile('client_logo')) {
            $path = $request->file('client_logo')->store('client_logos', 'public');
            $validated['client_logo'] = '/storage/' . $path;
        }

        unset($validated['client_logo_file']);
        $project->update($validated);

        return redirect()->back()->with('success', 'Project "' . $project->name . '" berhasil diperbarui!');
    }

    public function editArticle(Project $project): Response
    {
        return Inertia::render('projects/article-editor', [
            'project' => $project,
        ]);
    }

    public function updateArticle(Request $request, Project $project)
    {
        $validated = $request->validate([
            'slug' => 'nullable|string|max:255',
            'article_title' => 'nullable|string|max:255',
            'article_subtitle' => 'nullable|string',
            'article_content' => 'nullable|string',
            'initial_revenue' => 'nullable|string|max:255',
            'current_revenue' => 'nullable|string|max:255',
            'initial_roas' => 'nullable|string|max:255',
            'current_roas' => 'nullable|string|max:255',
            'growth_percentage' => 'nullable|string|max:255',
            'collaboration_story' => 'nullable|string',
            'key_results' => 'nullable|string',
        ]);

        $project->update($validated);

        return redirect()->route('projects.board', ['project_id' => $project->id])
            ->with('success', 'Artikel Case Study "' . $project->client . '" berhasil diperbarui!');
    }

    public function uploadArticleImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $path = $request->file('image')->store('article_images', 'public');

        return response()->json([
            'url' => '/storage/' . $path,
        ]);
    }
}
