<?php

use App\Models\Expense;
use App\Models\Income;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->demo = Project::create([
        'name' => 'Proyek Demo Rahasia',
        'client' => 'Demo Klien',
        'slug' => 'demo-klien',
        'is_demo' => true,
        'is_show_on_home' => true,
        'start_date' => '2026-10-01',
        'end_date' => '2026-12-01',
    ]);
    $this->normal = Project::create([
        'name' => 'Proyek Biasa',
        'client' => 'Klien Biasa',
        'slug' => 'klien-biasa',
        'is_show_on_home' => true,
        'start_date' => '2026-10-01',
        'end_date' => '2026-12-01',
    ]);

    Income::create(['project_id' => $this->demo->id, 'name' => 'Inc demo', 'amount' => 1000, 'date' => '2026-11-01']);
    Expense::create(['project_id' => $this->demo->id, 'name' => 'Exp demo', 'category' => 'Ads', 'amount' => 500, 'date' => '2026-11-01']);
});

test('home page lists the normal project but never the demo one', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('clientProjects', 1)
            ->where('clientProjects.0.id', $this->normal->id));
});

test('case study of a demo project redirects home', function () {
    $this->get('/case-study/demo-klien')->assertRedirect(route('home'));
    $this->get('/case-study/'.$this->demo->id)->assertRedirect(route('home'));
    $this->get('/case-study/klien-biasa')->assertOk();
});

test('finance project report excludes demo projects', function () {
    $admin = User::factory()->create()->assignRole('Super Admin');

    $this->actingAs($admin)
        ->get(route('finance.reports.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('projectProfitReport', fn ($report) => collect($report)->pluck('project_name')->doesntContain('Proyek Demo Rahasia')));
});

test('finance project csv export excludes demo projects', function () {
    $admin = User::factory()->create()->assignRole('Super Admin');

    $content = $this->actingAs($admin)
        ->get(route('finance.reports.export', ['type' => 'project']))
        ->assertOk()
        ->streamedContent();

    expect($content)->toContain('Proyek Biasa')->not->toContain('Proyek Demo Rahasia');
});

test('a demo project is still visible to its member', function () {
    $reviewer = User::factory()->create()->assignRole('Reviewer');
    ProjectMember::create(['project_id' => $this->demo->id, 'user_id' => $reviewer->id, 'role' => 'Member']);

    expect(Project::visibleTo($reviewer)->pluck('id')->all())->toContain($this->demo->id);
});
