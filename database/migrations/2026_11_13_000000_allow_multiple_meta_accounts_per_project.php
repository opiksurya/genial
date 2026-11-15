<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_meta_configs', function (Blueprint $table) {
            $table->dropUnique(['project_id']);
            $table->boolean('is_default')->default(false)->after('project_id');
            $table->unique(['project_id', 'ad_account_id']);
        });

        // Every existing row was the only account of its project, so it is the default.
        DB::table('project_meta_configs')->update(['is_default' => true]);
    }

    public function down(): void
    {
        Schema::table('project_meta_configs', function (Blueprint $table) {
            $table->dropUnique(['project_id', 'ad_account_id']);
            $table->dropColumn('is_default');
            $table->unique('project_id');
        });
    }
};
