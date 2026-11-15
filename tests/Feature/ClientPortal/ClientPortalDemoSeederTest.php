<?php

use App\Models\CreativeService;
use App\Models\Freelancer;
use App\Models\FreelancerAssignment;
use App\Models\Meeting;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\ClientPortalDemoSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->counts = fn (): array => [
        Project::count(), Meeting::count(), Freelancer::count(),
        FreelancerAssignment::count(), ProjectMember::count(), CreativeService::count(),
        Task::count(), Milestone::count(), User::count(),
    ];
});

test('seeding twice creates no duplicates', function () {
    User::factory()->create()->assignRole('Reviewer');

    $this->seed(ClientPortalDemoSeeder::class);
    $first = ($this->counts)();
    $this->seed(ClientPortalDemoSeeder::class);

    expect(($this->counts)())->toBe($first)
        ->and($first)->toBe([1, 2, 2, 2, 4, 2, 8, 3, 4]);
});

test('the demo project is flagged and hidden from home', function () {
    $this->seed(ClientPortalDemoSeeder::class);

    $demo = Project::where('slug', 'demo-portal-klien')->firstOrFail();
    expect($demo->is_demo)->toBeTrue()->and($demo->is_show_on_home)->toBeFalse();

    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->has('clientProjects', 0));
});

test('every reviewer becomes a member and sees the demo data on all four pages', function () {
    $reviewers = User::factory()->count(2)->create()->each->assignRole('Reviewer');

    $this->seed(ClientPortalDemoSeeder::class);

    foreach ($reviewers as $reviewer) {
        $this->actingAs($reviewer)->get(route('client.dashboard'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('projects', 1)->has('upcomingMeetings', 2));
        $this->actingAs($reviewer)->get(route('client.meetings.index'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('meetings', 2));
        $this->actingAs($reviewer)->get(route('client.freelancers.index'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('freelancers', 2));
        $this->actingAs($reviewer)->get(route('client.catalog.index'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('services', 2));
    }
});

test('demo assignments carry no money', function () {
    $this->seed(ClientPortalDemoSeeder::class);

    $demo = Project::where('slug', 'demo-portal-klien')->firstOrFail();
    $assignments = FreelancerAssignment::where('project_id', $demo->id)->get();

    expect($assignments)->toHaveCount(2)
        ->and((float) $assignments->sum('fee_amount'))->toBe(0.0)
        ->and(Freelancer::pluck('name')->every(fn ($n) => str_starts_with($n, '[Demo] ')))->toBeTrue();
});

test('services are only created when the catalog has no active service', function () {
    CreativeService::create([
        'name' => 'Poster Asli', 'category' => 'Desain', 'format' => 'JPG', 'description' => 'x',
        'deliverables' => '1', 'client_price' => 100000, 'freelancer_cost' => 50000,
        'unit' => 'per desain', 'turnaround_days' => 2, 'is_active' => true, 'sort_order' => 0,
    ]);

    $this->seed(ClientPortalDemoSeeder::class);

    expect(CreativeService::count())->toBe(1)
        ->and(CreativeService::where('name', 'like', '[Demo] %')->count())->toBe(0);
});

test('a non-reviewer user is not linked', function () {
    $client = User::factory()->create()->assignRole('Client');
    $staff = User::factory()->create()->assignRole('Staff');

    $this->seed(ClientPortalDemoSeeder::class);

    expect(ProjectMember::whereIn('user_id', [$client->id, $staff->id])->count())->toBe(0);
});

test('demo ProjectFlow data shows up for a reviewer on every ProjectFlow page', function () {
    $reviewer = User::factory()->create()->assignRole('Reviewer');

    $this->seed(ClientPortalDemoSeeder::class);

    foreach (['client.projectflow.index', 'client.projectflow.board', 'client.projectflow.timeline', 'client.projectflow.team', 'client.projectflow.reports'] as $name) {
        $this->actingAs($reviewer)->get(route($name))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('tasks', 8)
                ->has('milestones', 3)
                ->has('team', 4)
                ->where('stats.done', 2)
                ->where('stats.total', 8));
    }
});

test('demo team accounts cannot log in and carry no roles', function () {
    $this->seed(ClientPortalDemoSeeder::class);

    $demoUsers = User::where('email', 'like', '%@example.invalid')->get();

    expect($demoUsers)->toHaveCount(3);

    foreach ($demoUsers as $user) {
        expect($user->roles)->toHaveCount(0)
            ->and(auth()->validate(['email' => $user->email, 'password' => '']))->toBeFalse();
    }
});
