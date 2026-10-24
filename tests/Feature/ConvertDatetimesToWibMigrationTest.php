<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

function wibMigration(): Migration
{
    return require database_path('migrations/2026_10_24_175908_convert_datetimes_from_utc_to_wib.php');
}

beforeEach(function () {
    DB::table('users')->insert([
        ['id' => 1, 'name' => 'A', 'email' => 'a@example.com', 'password' => 'x', 'email_verified_at' => '2026-10-24 01:30:00', 'created_at' => '2026-10-23 20:00:00', 'updated_at' => '2026-10-24 10:15:45'],
        ['id' => 2, 'name' => 'B', 'email' => 'b@example.com', 'password' => 'x', 'email_verified_at' => null, 'created_at' => '2026-12-31 18:00:00', 'updated_at' => null],
    ]);

    DB::table('incomes')->insert([
        'id' => 1, 'name' => 'Website', 'amount' => 1000, 'date' => '2026-10-24', 'created_at' => '2026-10-24 17:00:00', 'updated_at' => '2026-10-24 17:00:00',
    ]);

    DB::table('meetings')->insert([
        'id' => 1, 'title' => 'Kickoff', 'start_time' => '2026-10-28 14:00:00', 'end_time' => '2026-10-28 15:00:00', 'created_at' => '2026-10-24 03:00:00', 'updated_at' => '2026-10-24 03:00:00',
    ]);

    DB::table('sessions')->insert(['id' => 'abc', 'payload' => 'x', 'last_activity' => 1761300000]);
    DB::table('cache')->insert(['key' => 'k', 'value' => 'v', 'expiration' => 1761300000]);
});

test('up shifts datetime columns forward by exactly seven hours and keeps nulls, dates and integers', function () {
    wibMigration()->up();

    $userA = DB::table('users')->find(1);
    $userB = DB::table('users')->find(2);
    $income = DB::table('incomes')->find(1);
    $meeting = DB::table('meetings')->find(1);

    expect($userA->email_verified_at)->toBe('2026-10-24 08:30:00')
        ->and($userA->created_at)->toBe('2026-10-24 03:00:00')
        ->and($userA->updated_at)->toBe('2026-10-24 17:15:45')
        ->and($userB->email_verified_at)->toBeNull()
        ->and($userB->updated_at)->toBeNull()
        ->and($userB->created_at)->toBe('2027-01-01 01:00:00')
        ->and($income->created_at)->toBe('2026-10-25 00:00:00')
        ->and($income->date)->toBe('2026-10-24')
        ->and($meeting->created_at)->toBe('2026-10-24 10:00:00')
        ->and($meeting->start_time)->toBe('2026-10-28 14:00:00')
        ->and($meeting->end_time)->toBe('2026-10-28 15:00:00')
        ->and(DB::table('sessions')->value('last_activity'))->toBe(1761300000)
        ->and(DB::table('cache')->value('expiration'))->toBe(1761300000);
});

test('down restores the original values exactly', function () {
    $snapshot = fn (): array => [
        DB::table('users')->orderBy('id')->get()->toArray(),
        DB::table('incomes')->get()->toArray(),
        DB::table('meetings')->get()->toArray(),
        DB::table('sessions')->get()->toArray(),
    ];

    $before = $snapshot();

    $migration = wibMigration();
    $migration->up();
    $migration->down();

    expect($snapshot())->toEqual($before);
});

test('it discovers datetime columns dynamically and skips framework tables and wib meeting times', function () {
    $columns = collect(wibMigration()->datetimeColumns())
        ->map(fn (array $column): string => "{$column['table']}.{$column['column']}");

    expect($columns)->toContain('users.created_at', 'users.email_verified_at', 'incomes.created_at', 'meetings.created_at', 'project_meta_configs.token_expires_at')
        ->not->toContain('incomes.date', 'meetings.start_time', 'meetings.end_time', 'failed_jobs.failed_at', 'sessions.last_activity', 'cache.expiration')
        ->and($columns->contains(fn (string $column): bool => str_starts_with($column, 'migrations.')))->toBeFalse();
});
