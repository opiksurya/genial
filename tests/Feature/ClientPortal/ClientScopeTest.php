<?php

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Services\ClientPortal\ClientScope;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function () {
    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->own = Project::create(['name' => 'Beta Store', 'client' => 'Mine', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->second = Project::create(['name' => 'Alpha Store', 'client' => 'Mine', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->other = Project::create(['name' => 'Toko Rahasia', 'client' => 'CV Rahasia', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->client = User::factory()->create()->assignRole('Client');
    foreach ([$this->own, $this->second] as $project) {
        ProjectMember::create(['project_id' => $project->id, 'user_id' => $this->client->id, 'role' => 'Member']);
    }

    $this->requestFor = function (User $user, array $query = []): Request {
        $request = Request::create('/x', 'GET', $query);
        $request->setUserResolver(fn () => $user);

        return $request;
    };
});

test('projects only contains the user\'s projects with safe columns', function () {
    $projects = ClientScope::for(($this->requestFor)($this->client))->projects();

    expect($projects->pluck('id')->all())->toBe([$this->second->id, $this->own->id])
        ->and(array_keys($projects->first()->getAttributes()))->toBe(['id', 'name', 'client', 'status', 'progress']);
});

test('a valid project_id narrows projectIds and sets selectedProjectId', function () {
    $scope = ClientScope::for(($this->requestFor)($this->client, ['project_id' => (string) $this->own->id]));

    expect($scope->selectedProjectId())->toBe($this->own->id)
        ->and($scope->projectIds())->toBe([$this->own->id])
        ->and($scope->allProjectIds())->toEqualCanonicalizing([$this->own->id, $this->second->id]);
});

test('a project_id of another client is ignored, not rejected', function () {
    $scope = ClientScope::for(($this->requestFor)($this->client, ['project_id' => $this->other->id]));

    expect($scope->selectedProjectId())->toBeNull()
        ->and($scope->projectIds())->toEqualCanonicalizing([$this->own->id, $this->second->id])
        ->and($scope->projectIds())->not->toContain($this->other->id);
});

test('a non-numeric or unknown project_id is ignored', function (mixed $value) {
    $scope = ClientScope::for(($this->requestFor)($this->client, ['project_id' => $value]));

    expect($scope->selectedProjectId())->toBeNull()
        ->and($scope->projectIds())->toHaveCount(2);
})->with(['abc', '999999', '', '1.5', [['1']], '-1']);

test('a member without projects gets empty projects and ids', function () {
    $lonely = User::factory()->create()->assignRole('Reviewer');
    $scope = ClientScope::for(($this->requestFor)($lonely, ['project_id' => $this->own->id]));

    expect($scope->projects())->toBeEmpty()
        ->and($scope->selectedProjectId())->toBeNull()
        ->and($scope->projectIds())->toBe([])
        ->and($scope->allProjectIds())->toBe([]);
});

test('staff are refused', function (string $role) {
    $staff = User::factory()->create()->assignRole($role);

    expect(fn () => ClientScope::for(($this->requestFor)($staff)))->toThrow(HttpException::class);
    try {
        ClientScope::for(($this->requestFor)($staff));
    } catch (HttpException $e) {
        expect($e->getStatusCode())->toBe(403);
    }
})->with(['Staff', 'Admin', 'Super Admin']);

test('a request without a user is refused', function () {
    $request = Request::create('/x');

    expect(fn () => ClientScope::for($request))->toThrow(HttpException::class);
});
