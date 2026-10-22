<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop Postgres enum check constraint on category so it can store dynamic allocation names
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check');
        }

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('allocation_id')->nullable()->after('project_id')->constrained('allocations')->onDelete('set null');
            $table->foreignId('sub_allocation_id')->nullable()->after('allocation_id')->constrained('sub_allocations')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['sub_allocation_id']);
            $table->dropForeign(['allocation_id']);
            $table->dropColumn(['allocation_id', 'sub_allocation_id']);
        });
    }
};
