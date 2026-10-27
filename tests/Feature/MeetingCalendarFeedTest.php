<?php

use App\Models\Meeting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Create a meeting owned by the given user.
 */
function createMeetingFor(User $user, string $title): Meeting
{
    return Meeting::create([
        'title' => $title,
        'start_time' => now()->addDay(),
        'end_time' => now()->addDay()->addHour(),
        'platform' => 'google_meet',
        'meeting_link' => 'https://meet.google.com/'.str($title)->slug(),
        'user_id' => $user->id,
        'status' => 'scheduled',
    ]);
}

test('the old public feed url without a token does not return any meeting data', function () {
    $owner = User::factory()->create();
    createMeetingFor($owner, 'Rapat Rahasia Klien');
    config(['app.debug' => false]);

    $response = $this->get('/meetings/feed.ics');

    $response->assertGone();
    expect($response->getContent())
        ->not->toContain('Rapat Rahasia Klien')
        ->not->toContain('BEGIN:VCALENDAR');
});

test('a wrong feed token returns 404', function (string $wrongToken) {
    $owner = User::factory()->create();
    createMeetingFor($owner, 'Rapat Rahasia Klien');

    $this->get("/meetings/feed/{$wrongToken}.ics")
        ->assertNotFound()
        ->assertDontSee('Rapat Rahasia Klien');
})->with([
    'random 64 hex characters' => fn () => bin2hex(random_bytes(32)),
    'short guess' => 'abc',
]);

test('the correct feed token returns only the meetings of the token owner', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    createMeetingFor($owner, 'Rapat Milik Pemilik Token');
    createMeetingFor($otherUser, 'Rapat Milik User Lain');

    expect($owner->calendar_feed_token)->toHaveLength(64);

    $response = $this->get(route('meetings.feed', ['token' => $owner->calendar_feed_token]));

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/calendar; charset=utf-8')
        ->assertSee('Rapat Milik Pemilik Token')
        ->assertDontSee('Rapat Milik User Lain');

    expect($response->headers->get('Cache-Control'))
        ->toContain('private')
        ->toContain('no-store');
});

test('regenerating the token revokes the old feed url', function () {
    $owner = User::factory()->create();
    createMeetingFor($owner, 'Rapat Mingguan');
    $oldToken = $owner->calendar_feed_token;

    $this->actingAs($owner)
        ->post(route('meetings.feed-token.regenerate'))
        ->assertRedirect();

    $newToken = $owner->fresh()->calendar_feed_token;

    expect($newToken)->not->toBe($oldToken)->toHaveLength(64);

    $this->get("/meetings/feed/{$oldToken}.ics")->assertNotFound();
    $this->get("/meetings/feed/{$newToken}.ics")
        ->assertOk()
        ->assertSee('Rapat Mingguan');
});

test('guests cannot regenerate a feed token', function () {
    $this->post(route('meetings.feed-token.regenerate'))
        ->assertRedirect(route('login'));
});

test('the migration gives every existing user a unique feed token', function () {
    $migration = require database_path('migrations/2026_10_27_124052_add_calendar_feed_token_to_users_table.php');
    $migration->down();

    DB::table('users')->insert([
        ['name' => 'A', 'email' => 'a@example.com', 'password' => 'x'],
        ['name' => 'B', 'email' => 'b@example.com', 'password' => 'x'],
    ]);

    $migration->up();

    $tokens = DB::table('users')->pluck('calendar_feed_token');

    expect($tokens)->toHaveCount(2)
        ->each->toMatch('/^[a-f0-9]{64}$/')
        ->and($tokens->unique())->toHaveCount(2);
});

test('the meetings page shows the private feed url of the logged in user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('meetings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('meetings/index')
            ->where('calendarFeedUrl', route('meetings.feed', ['token' => $user->calendar_feed_token])));
});
