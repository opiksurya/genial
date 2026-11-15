<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * A role for outside reviewers (for example the Shopee Open Platform app review).
     * It carries no permissions; what a Reviewer can open is limited by the ConfineReviewer middleware.
     */
    public function up(): void
    {
        Role::firstOrCreate(['name' => 'Reviewer', 'guard_name' => 'web']);
    }

    public function down(): void
    {
        Role::where('name', 'Reviewer')->where('guard_name', 'web')->delete();
    }
};
