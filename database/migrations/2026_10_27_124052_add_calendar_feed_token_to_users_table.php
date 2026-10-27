<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a secret per-user token for the private meetings iCalendar feed
     * and fill it for every existing user.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('calendar_feed_token', 64)->nullable()->unique()->after('google_calendar_id');
        });

        DB::table('users')
            ->whereNull('calendar_feed_token')
            ->orderBy('id')
            ->pluck('id')
            ->each(function (int $userId): void {
                DB::table('users')
                    ->where('id', $userId)
                    ->update(['calendar_feed_token' => bin2hex(random_bytes(32))]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['calendar_feed_token']);
            $table->dropColumn('calendar_feed_token');
        });
    }
};
