<?php

use App\Models\Meeting;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Carbon\Carbon;
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

    $this->meeting = function (?Project $project, array $attrs = []): Meeting {
        return Meeting::create(array_merge([
            'title' => 'Rapat '.($project?->name ?? 'internal'),
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'platform' => 'google_meet',
            'project_id' => $project?->id,
        ], $attrs));
    };
});

test('lists only meetings of the member\'s projects', function () {
    ($this->meeting)($this->own, ['title' => 'Kedua', 'start_time' => now()->addDays(2), 'end_time' => now()->addDays(2)->addHour()]);
    ($this->meeting)($this->own, ['title' => 'Pertama']);
    ($this->meeting)($this->other, ['title' => 'Milik Orang Lain']);
    ($this->meeting)(null, ['title' => 'Tanpa Proyek']);

    $this->actingAs($this->client)->get(route('client.meetings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/meetings')
            ->has('meetings', 2)
            ->where('meetings.0.title', 'Pertama')
            ->where('meetings.1.title', 'Kedua')
            ->where('meetings.0.project_name', 'Toko Saya')
            ->where('selectedProjectId', null)
            ->has('projects', 2));
});

test('a project filter narrows the list', function () {
    ($this->meeting)($this->own, ['title' => 'Rapat A']);
    ($this->meeting)($this->second, ['title' => 'Rapat B']);

    $this->actingAs($this->client)->get(route('client.meetings.index', ['project_id' => $this->second->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('meetings', 1)
            ->where('meetings.0.title', 'Rapat B')
            ->where('selectedProjectId', $this->second->id));
});

test('attendees, creator and google fields never reach the client', function () {
    $creator = User::factory()->create(['email' => 'pembuat-rahasia@example.com']);

    ($this->meeting)($this->own, [
        'attendees' => ['peserta-rahasia@example.com'],
        'user_id' => $creator->id,
        'google_event_id' => 'gevent-rahasia-123',
        'google_meet_link' => 'https://meet.google.com/rahasia-xyz',
    ]);

    $response = $this->actingAs($this->client)->get(route('client.meetings.index'))->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->has('meetings.0', fn (Assert $m) => $m
            ->hasAll(['id', 'title', 'description', 'start_time', 'end_time', 'platform', 'meeting_link', 'location', 'status', 'project_name'])
            ->etc()));

    $content = $response->getContent();
    foreach (['peserta-rahasia@example.com', 'pembuat-rahasia@example.com', 'gevent-rahasia-123', 'rahasia-xyz', 'google_calendar_url', 'attendees'] as $secret) {
        expect($content)->not->toContain($secret);
    }
});

test('a client downloads the ics of their own meeting', function () {
    $meeting = ($this->meeting)($this->own, ['title' => 'Kickoff Proyek']);

    $response = $this->actingAs($this->client)->get('/client/meetings/'.$meeting->id.'/ics');

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('text/calendar');
    expect($response->headers->get('Content-Disposition'))->toContain('meeting-'.$meeting->id.'.ics');
    expect($response->getContent())->toContain('BEGIN:VEVENT')->toContain('SUMMARY:Kickoff Proyek');
});

test('the ics ignores the project filter but not membership', function () {
    $inSecond = ($this->meeting)($this->second);

    $this->actingAs($this->client)
        ->get('/client/meetings/'.$inSecond->id.'/ics?project_id='.$this->own->id)
        ->assertOk();
});

test('the ics of another client\'s meeting is 404', function () {
    $theirs = ($this->meeting)($this->other);
    $internal = ($this->meeting)(null);

    $this->actingAs($this->client)->get('/client/meetings/'.$theirs->id.'/ics')->assertNotFound();
    $this->actingAs($this->client)->get('/client/meetings/'.$internal->id.'/ics')->assertNotFound();
});

test('member without projects sees an empty list', function () {
    ($this->meeting)($this->own);
    $loner = User::factory()->create()->assignRole('Client');

    $this->actingAs($loner)->get(route('client.meetings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('meetings', 0)
            ->has('projects', 0));
});

test('staff download-ics output is unchanged after extraction', function () {
    Carbon::setTestNow('2026-11-15 03:00:00');
    config(['app.url' => 'https://portal.example.test']);

    $meeting = Meeting::create([
        'title' => 'Rapat; Review, Mingguan',
        'description' => "Agenda satu\nAgenda; dua, tiga",
        'start_time' => '2026-11-20 02:00:00',
        'end_time' => '2026-11-20 03:30:00',
        'platform' => 'google_meet',
        'meeting_link' => 'https://meet.example.test/abc',
    ]);

    $staff = User::factory()->create()->assignRole('Super Admin');
    $response = $this->actingAs($staff)->get(route('meetings.download-ics', $meeting));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toBe('text/calendar; charset=utf-8');
    expect($response->headers->get('Content-Disposition'))->toBe('attachment; filename="meeting-'.$meeting->id.'.ics"');

    $expected = implode("\r\n", [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Genial Digital Solution//Meeting Agendas//ID',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:genial-meeting-'.$meeting->id.'@portal.example.test',
        'DTSTAMP:20261114T200000Z',
        'DTSTART:20261119T190000Z',
        'DTEND:20261119T203000Z',
        'SUMMARY:Rapat\; Review\, Mingguan',
        'DESCRIPTION:Agenda satu\nAgenda\; dua\, tiga\nLink: https://meet.example.test/abc',
        'LOCATION:https://meet.example.test/abc',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
    ]);

    expect($response->getContent())->toBe($expected);

    Carbon::setTestNow();
});
