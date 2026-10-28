<?php

use App\Models\Project;
use App\Models\ProjectMetaConfig;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->project = Project::create(['name' => 'Toko Batik', 'client' => 'CV Batik', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
});

test('the board tells the connect modal a token is stored without sending the token', function () {
    ProjectMetaConfig::create([
        'project_id' => $this->project->id,
        'ad_account_id' => 'act_123',
        'access_token' => 'secret-meta-token',
        'app_secret' => 'secret-app-secret',
        'status' => 'connected',
    ]);

    Role::findOrCreate('Super Admin');
    $user = User::factory()->create()->assignRole('Super Admin');

    $response = $this->actingAs($user)->get(route('projects.board', ['project_id' => $this->project->id]));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('activeProject.meta_config.has_access_token', true)
            ->missing('activeProject.meta_config.access_token')
            ->missing('activeProject.meta_config.app_secret')
        );

    expect($response->getContent())
        ->not->toContain('secret-meta-token')
        ->not->toContain('secret-app-secret');
});

test('has_access_token is false when no token is stored', function () {
    $config = ProjectMetaConfig::create([
        'project_id' => $this->project->id,
        'status' => 'disconnected',
    ]);

    expect($config->fresh()->toArray())
        ->toHaveKey('has_access_token', false)
        ->not->toHaveKey('access_token');
});

test('the access token is encrypted at rest and still readable by the app', function () {
    $config = ProjectMetaConfig::create([
        'project_id' => $this->project->id,
        'access_token' => 'secret-meta-token',
        'status' => 'connected',
    ]);

    $stored = DB::table('project_meta_configs')->where('id', $config->id)->value('access_token');

    expect($stored)->not->toBe('secret-meta-token')
        ->and($config->fresh()->access_token)->toBe('secret-meta-token');
});
