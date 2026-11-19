<?php

use App\Models\Freelancer;
use App\Models\FreelancerAssignment;
use App\Models\Project;
use App\Models\ProjectMember;
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

    $this->client = User::factory()->create()->assignRole('Client');
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $this->client->id, 'role' => 'Member']);
    ProjectMember::create(['project_id' => $this->second->id, 'user_id' => $this->client->id, 'role' => 'Member']);

    $this->freelancer = function (string $name, array $attrs = []): Freelancer {
        return Freelancer::create(array_merge(['name' => $name, 'role' => 'Desainer', 'status' => 'active'], $attrs));
    };

    $this->assign = function (Freelancer $freelancer, Project $project, string $status = 'assigned'): FreelancerAssignment {
        return FreelancerAssignment::create([
            'freelancer_id' => $freelancer->id,
            'project_id' => $project->id,
            'title' => 'Tugas '.$freelancer->name,
            'status' => $status,
        ]);
    };
});

test('shows only freelancers assigned to the member\'s projects', function () {
    $mine = ($this->freelancer)('Budi Santoso');
    $first = ($this->freelancer)('Agus Wijaya');
    $theirs = ($this->freelancer)('Citra Rahasia');
    ($this->freelancer)('Dewi Menganggur');
    ($this->assign)($mine, $this->own);
    ($this->assign)($first, $this->second);
    ($this->assign)($theirs, $this->other);

    $this->actingAs($this->client)->get(route('client.freelancers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/freelancers')
            ->has('freelancers', 2)
            ->where('freelancers.0.name', 'Agus Wijaya')
            ->where('freelancers.1.name', 'Budi Santoso')
            ->where('selectedProjectId', null)
            ->has('projects', 2));
});

test('a project filter narrows the list', function () {
    ($this->assign)(($this->freelancer)('Budi Santoso'), $this->own);
    ($this->assign)(($this->freelancer)('Agus Wijaya'), $this->second);

    $this->actingAs($this->client)->get(route('client.freelancers.index', ['project_id' => $this->second->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('freelancers', 1)
            ->where('freelancers.0.name', 'Agus Wijaya')
            ->where('selectedProjectId', $this->second->id));
});

test('a freelancer with assignments on two clients appears once and counts only this client\'s projects', function () {
    $shared = ($this->freelancer)('Eka Lintas');
    ($this->assign)($shared, $this->own, 'completed');
    ($this->assign)($shared, $this->own, 'in_progress');
    ($this->assign)($shared, $this->second, 'revision');
    ($this->assign)($shared, $this->other, 'completed');
    ($this->assign)($shared, $this->other, 'assigned');
    ($this->assign)($shared, $this->other, 'submitted');

    $this->actingAs($this->client)->get(route('client.freelancers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('freelancers', 1)
            ->where('freelancers.0.stats', ['completed' => 1, 'active' => 2, 'total' => 3]));

    $this->actingAs($this->client)->get(route('client.freelancers.index', ['project_id' => $this->second->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('freelancers.0.stats', ['completed' => 0, 'active' => 1, 'total' => 1]));
});

test('inactive freelancers are hidden', function () {
    ($this->assign)(($this->freelancer)('Fajar Nonaktif', ['status' => 'inactive']), $this->own);
    ($this->assign)(($this->freelancer)('Gita Aktif'), $this->own);

    $this->actingAs($this->client)->get(route('client.freelancers.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('freelancers', 1)
            ->where('freelancers.0.name', 'Gita Aktif'));
});

test('private data never reaches the client', function () {
    $freelancer = ($this->freelancer)('Hana Privat', [
        'email' => 'hana-rahasia@example.com',
        'phone' => '081299887766',
        'rate_per_project' => 7654321,
        'bank_name' => 'Bank Rahasia Nusantara',
        'bank_account_number' => '9988776655',
        'bank_account_name' => 'Hana Pemilik Rekening',
        'access_token' => 'token-rahasia-abcdef123456',
        'notes' => 'catatan-internal-rahasia',
        'portfolio_link' => 'https://portfolio.example.com/hana',
    ]);
    ($this->assign)($freelancer, $this->own);

    $response = $this->actingAs($this->client)->get(route('client.freelancers.index'))->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->has('freelancers.0', fn (Assert $f) => $f
            ->hasAll(['id', 'name', 'initials', 'skill', 'portfolio_link', 'stats'])
            ->where('portfolio_link', 'https://portfolio.example.com/hana')));

    $content = $response->getContent();
    foreach ([
        'hana-rahasia@example.com', '081299887766', '7654321', '9988776655',
        'Bank Rahasia Nusantara', 'Hana Pemilik Rekening', 'token-rahasia-abcdef123456',
        'catatan-internal-rahasia', 'portal_url', '/freelancer/portal/',
    ] as $secret) {
        expect($content)->not->toContain($secret);
    }
});

test('initials and skill are derived', function () {
    ($this->assign)(($this->freelancer)('Alina Putri', ['role' => 'Video Editor']), $this->own);
    ($this->assign)(($this->freelancer)('Zed', ['role' => 'Penulis']), $this->own);

    $this->actingAs($this->client)->get(route('client.freelancers.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('freelancers.0.initials', 'AP')
            ->where('freelancers.0.skill', 'Video Editor')
            ->where('freelancers.1.initials', 'Z')
            ->where('freelancers.1.skill', 'Penulis'));
});

test('member without projects sees an empty list', function () {
    ($this->assign)(($this->freelancer)('Budi Santoso'), $this->own);
    $loner = User::factory()->create()->assignRole('Client');

    $this->actingAs($loner)->get(route('client.freelancers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('freelancers', 0)
            ->has('projects', 0));
});
