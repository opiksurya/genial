<?php

use App\Models\Meeting;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Services\MetaAdsAnalytics\MetaAdsAnalyticsSource;
use App\Services\MetaAdsAnalytics\MetaAdsPeriod;
use App\Services\ShopeeAnalytics\ShopeeAnalyticsSource;
use App\Services\ShopeeAnalytics\ShopeePeriod;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
    Cache::flush();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->own = Project::create(['name' => 'Toko Saya', 'client' => 'Saya', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);
    $this->other = Project::create(['name' => 'Toko Rahasia', 'client' => 'CV Rahasia', 'start_date' => '2026-10-01', 'end_date' => '2026-12-01']);

    $this->client = User::factory()->create()->assignRole('Client');
    ProjectMember::create(['project_id' => $this->own->id, 'user_id' => $this->client->id, 'role' => 'Member']);

    $this->calls = new ArrayObject(['shopee' => 0, 'meta' => 0]);
    $calls = $this->calls;

    $this->bindFakes = function (bool $failing = false) use ($calls): void {
        app()->instance(ShopeeAnalyticsSource::class, new class($calls, $failing) implements ShopeeAnalyticsSource
        {
            public function __construct(private ArrayObject $calls, private bool $failing) {}

            public function report(ShopeePeriod $period, CarbonImmutable $endDate, ?Project $project = null): array
            {
                $this->calls['shopee']++;

                if ($this->failing) {
                    throw new RuntimeException('shopee down');
                }

                return [
                    'isConnected' => true,
                    'summary' => ['kpis' => [
                        ['key' => 'revenue', 'value' => 1500000],
                        ['key' => 'orders', 'value' => 42],
                        ['key' => 'roas', 'value' => 3.5],
                    ]],
                ];
            }
        });

        app()->instance(MetaAdsAnalyticsSource::class, new class($calls, $failing) implements MetaAdsAnalyticsSource
        {
            public function __construct(private ArrayObject $calls, private bool $failing) {}

            public function report(MetaAdsPeriod $period, CarbonImmutable $endDate, ?Project $project = null): array
            {
                $this->calls['meta']++;

                if ($this->failing) {
                    throw new RuntimeException('meta down');
                }

                return [
                    'isConnected' => true,
                    'summary' => ['totals' => ['spend' => 500000, 'revenue' => 2000000, 'roas' => 4.0, 'purchases' => 30]],
                ];
            }
        });
    };
    ($this->bindFakes)();

    $this->meeting = function (Project $project, array $attrs = []): Meeting {
        return Meeting::create(array_merge([
            'title' => 'Rapat '.$project->name,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'platform' => 'google_meet',
            'project_id' => $project->id,
        ], $attrs));
    };
});

test('dashboard shows only the member\'s projects and upcoming meetings', function () {
    ($this->meeting)($this->own, ['title' => 'Kickoff']);

    $this->actingAs($this->client)->get(route('client.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/dashboard')
            ->has('projects', 1)
            ->where('projects.0.id', $this->own->id)
            ->where('selectedProjectId', null)
            ->has('upcomingMeetings', 1)
            ->where('upcomingMeetings.0.title', 'Kickoff')
            ->where('upcomingMeetings.0.project_name', 'Toko Saya'));
});

test('meetings of another project never appear', function () {
    ($this->meeting)($this->other, ['title' => 'Rahasia Meeting']);

    $response = $this->actingAs($this->client)->get(route('client.dashboard', ['project_id' => $this->other->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('upcomingMeetings', 0));

    expect($response->getContent())->not->toContain('Rahasia Meeting')->not->toContain('CV Rahasia');
});

test('cancelled and past meetings are not upcoming', function () {
    ($this->meeting)($this->own, ['title' => 'Batal', 'status' => 'cancelled']);
    ($this->meeting)($this->own, ['title' => 'Lewat', 'start_time' => now()->subDay(), 'end_time' => now()->subDay()->addHour()]);
    ($this->meeting)($this->own, ['title' => 'Nanti']);

    $this->actingAs($this->client)->get(route('client.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('upcomingMeetings', 1)
            ->where('upcomingMeetings.0.title', 'Nanti'));
});

test('performance comes from the connected sources', function () {
    $this->actingAs($this->client)->get(route('client.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('performance.shopee.isConnected', true)
            ->where('performance.shopee.revenue', 1500000)
            ->where('performance.shopee.orders', 42)
            ->where('performance.meta.spend', 500000)
            ->where('performance.meta.purchases', 30));
});

test('a failing analytics source yields isConnected false and still 200', function () {
    ($this->bindFakes)(true);

    $this->actingAs($this->client)->get(route('client.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('performance.shopee.isConnected', false)
            ->where('performance.shopee.revenue', null)
            ->where('performance.meta.isConnected', false)
            ->where('performance.meta.spend', null));
});

test('the performance summary is cached for five minutes', function () {
    $this->actingAs($this->client)->get(route('client.dashboard'))->assertOk();
    $this->actingAs($this->client)->get(route('client.dashboard'))->assertOk();

    expect($this->calls['shopee'])->toBe(1)->and($this->calls['meta'])->toBe(1);
    expect(Cache::has('client-portal.performance.'.$this->own->id))->toBeTrue();
});

test('a member without projects sees an empty dashboard', function () {
    $lonely = User::factory()->create()->assignRole('Client');

    $this->actingAs($lonely)->get(route('client.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects', 0)
            ->has('upcomingMeetings', 0)
            ->where('performance', null));
});

test('nothing internal is exposed', function () {
    $content = $this->actingAs($this->client)->get(route('client.dashboard'))->getContent();

    expect($content)->not->toContain('leads')
        ->not->toContain('totalUsers')
        ->not->toContain('&quot;canAccessFinance&quot;:true');
});
