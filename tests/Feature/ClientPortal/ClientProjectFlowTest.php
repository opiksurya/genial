<?php

use App\Models\Milestone;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->own = Project::create(['name' => 'Toko Saya', 'client' => 'Saya', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->second = Project::create(['name' => 'Toko Kedua', 'client' => 'Saya', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->other = Project::create(['name' => 'Toko Rahasia', 'client' => 'CV Rahasia', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->staff = User::factory()->create(['name' => 'Staf Genial', 'email' => 'staf-internal@genial.test'])->assignRole('Staff');
    $this->client = User::factory()->create()->assignRole('Client');
    foreach ([$this->own, $this->second] as $project) {
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->client->id, 'role' => 'Member']);
    }
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $this->staff->id, 'role' => 'Designer']);

    $this->task = function (Project $project, array $attrs = []): Task {
        return Task::create(array_merge([
            'project_id' => $project->id,
            'title' => 'Tugas '.$project->name,
            'status' => 'IN_PROGRESS',
            'priority' => 'MEDIUM',
            'assignee_id' => $this->staff->id,
            'start_date' => '2026-10-02',
            'due_date' => '2026-10-10',
        ], $attrs));
    };
});

test('shows only the tasks, milestones and team of the member\'s projects', function () {
    ($this->task)($this->own, ['title' => 'Tugas Milik Saya']);
    ($this->task)($this->other, ['title' => 'Tugas Orang Lain']);
    Milestone::create(['project_id' => $this->own->id, 'title' => 'Peluncuran', 'due_date' => '2026-11-01']);
    Milestone::create(['project_id' => $this->other->id, 'title' => 'Rahasia Milestone', 'due_date' => '2026-11-01']);

    $this->actingAs($this->client)
        ->get(route('client.projectflow.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/projectflow')
            ->has('tasks', 1)
            ->where('tasks.0.title', 'Tugas Milik Saya')
            ->has('milestones', 1)
            ->where('milestones.0.title', 'Peluncuran')
            ->has('projectDetails', 2)
            ->where('stats.total', 1));
});

test('project_id narrows to one project and ignores foreign ids', function () {
    ($this->task)($this->own, ['title' => 'A']);
    ($this->task)($this->second, ['title' => 'B']);
    ($this->task)($this->other, ['title' => 'C']);

    $this->actingAs($this->client)
        ->get(route('client.projectflow.index', ['project_id' => $this->second->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('tasks', 1)->where('tasks.0.title', 'B'));

    $this->actingAs($this->client)
        ->get(route('client.projectflow.index', ['project_id' => $this->other->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('tasks', 2));
});

test('internal data never reaches the browser', function () {
    $task = ($this->task)($this->own, ['description' => 'CATATAN INTERNAL RAHASIA', 'link' => 'https://internal.example/doc']);
    TaskComment::create(['task_id' => $task->id, 'user_id' => $this->staff->id, 'comment' => 'KOMENTAR INTERNAL']);
    $this->own->update(['description' => 'DESKRIPSI INTERNAL']);

    $response = $this->actingAs($this->client)->get(route('client.projectflow.index'))->assertOk();
    $json = json_encode($response->viewData('page')['props']);

    foreach (['CATATAN INTERNAL RAHASIA', 'internal.example', 'KOMENTAR INTERNAL', 'DESKRIPSI INTERNAL', 'staf-internal@genial.test', 'commission', 'credential'] as $leak) {
        expect($json)->not->toContain($leak);
    }

    // Team members expose name and role only.
    $response->assertInertia(fn (Assert $page) => $page
        ->where('team.0.name', fn ($name) => is_string($name))
        ->missing('team.0.email')
        ->missing('tasks.0.description')
        ->missing('tasks.0.comments'));
});

test('every ProjectFlow sub page renders its view with scoped data', function (string $routeName, string $view) {
    ($this->task)($this->own, ['title' => 'Milik Saya', 'status' => 'DONE']);
    ($this->task)($this->other, ['title' => 'Milik Orang Lain']);

    $this->actingAs($this->client)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/projectflow')
            ->where('view', $view)
            ->has('tasks', 1)
            ->has('performance', 2)
            ->where('performance.0.total', fn ($total) => $total <= 1));
})->with([
    ['client.projectflow.index', 'dashboard'],
    ['client.projectflow.board', 'board'],
    ['client.projectflow.timeline', 'timeline'],
    ['client.projectflow.team', 'team'],
    ['client.projectflow.reports', 'reports'],
]);

test('reviewer sees the same read-only page', function () {
    $reviewer = User::factory()->create()->assignRole('Reviewer');
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $reviewer->id, 'role' => 'Member']);
    ($this->task)($this->own);
    ($this->task)($this->other);

    $this->actingAs($reviewer)
        ->get(route('client.projectflow.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('tasks', 1));
});

test('staff are not served by the client page and guests are redirected', function () {
    $this->actingAs($this->staff)->get(route('client.projectflow.index'))->assertForbidden();
    auth()->logout();
    $this->get(route('client.projectflow.index'))->assertRedirect();
});

test('internal ProjectFlow routes and write routes stay closed to clients', function () {
    $task = ($this->task)($this->own);

    foreach (['projects.dashboard', 'projects.board', 'projects.timeline', 'projects.team', 'projects.reports'] as $name) {
        $this->actingAs($this->client)->get(route($name))->assertRedirect(route('client.dashboard'));
    }

    $this->actingAs($this->client)->putJson(route('projects.tasks.update', $task), ['title' => 'X'])->assertForbidden();
    $this->actingAs($this->client)->putJson(route('projects.tasks.updateStatus', $task), ['status' => 'DONE'])->assertForbidden();
    $this->actingAs($this->client)->postJson(route('projects.tasks.comments.store', $task), ['comment' => 'x'])->assertForbidden();
    $this->actingAs($this->client)->postJson(route('client.projectflow.index'))->assertStatus(405);
});
