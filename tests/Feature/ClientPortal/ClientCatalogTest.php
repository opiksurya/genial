<?php

use App\Models\CreativeService;
use App\Models\Setting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();

    foreach (['Super Admin', 'Admin', 'Staff', 'Client', 'Reviewer'] as $role) {
        Role::findOrCreate($role);
    }

    $this->client = User::factory()->create()->assignRole('Client');

    $this->service = function (string $name, array $attrs = []): CreativeService {
        return CreativeService::create(array_merge([
            'name' => $name,
            'category' => 'Desain',
            'format' => 'JPG',
            'description' => 'Deskripsi '.$name,
            'deliverables' => '3 file',
            'client_price' => 350000,
            'freelancer_cost' => 123457,
            'unit' => 'per desain',
            'turnaround_days' => 3,
            'is_active' => true,
            'sort_order' => 0,
        ], $attrs));
    };
});

test('lists active services with their client price', function () {
    ($this->service)('Poster Promo');

    $this->actingAs($this->client)->get(route('client.catalog.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/catalog')
            ->has('services', 1)
            ->where('services.0.name', 'Poster Promo')
            ->where('services.0.client_price', 350000)
            ->where('services.0.turnaround_days', 3)
            ->has('services.0', fn (Assert $s) => $s
                ->hasAll(['id', 'name', 'category', 'format', 'description', 'deliverables', 'client_price', 'unit', 'turnaround_days'])));
});

test('services are ordered by sort order then name', function () {
    ($this->service)('Zeta', ['sort_order' => 1]);
    ($this->service)('Beta', ['sort_order' => 2]);
    ($this->service)('Alfa', ['sort_order' => 1]);

    $this->actingAs($this->client)->get(route('client.catalog.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('services.0.name', 'Alfa')
            ->where('services.1.name', 'Zeta')
            ->where('services.2.name', 'Beta'));
});

test('inactive services are hidden', function () {
    ($this->service)('Layanan Aktif');
    ($this->service)('Layanan Mati', ['is_active' => false]);

    $this->actingAs($this->client)->get(route('client.catalog.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('services', 1)
            ->where('services.0.name', 'Layanan Aktif'));
});

test('freelancer cost and margin never reach the client', function () {
    ($this->service)('Poster Promo');

    $response = $this->actingAs($this->client)->get(route('client.catalog.index'))->assertOk();

    $content = $response->getContent();
    foreach (['freelancer_cost', 'estimated_margin', 'is_active', 'sort_order', '123457'] as $secret) {
        expect($content)->not->toContain($secret);
    }
});

test('exposes the whatsapp number from settings', function () {
    Setting::set('whatsapp_number', '628111222333');

    $this->actingAs($this->client)->get(route('client.catalog.index'))
        ->assertInertia(fn (Assert $page) => $page->where('whatsappNumber', '628111222333'));
});

test('falls back to the default whatsapp number', function () {
    $this->actingAs($this->client)->get(route('client.catalog.index'))
        ->assertInertia(fn (Assert $page) => $page->where('whatsappNumber', '6281234567890'));
});

test('an empty catalog is a normal page', function () {
    $this->actingAs($this->client)->get(route('client.catalog.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('services', 0));
});

test('non-client roles are refused', function () {
    $staff = User::factory()->create()->assignRole('Staff');

    $this->actingAs($staff)->get(route('client.catalog.index'))->assertForbidden();
});
