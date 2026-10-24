<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('project_meta_configs', function (Blueprint $table) {
            $table->string('app_id')->nullable()->after('pixel_id');
            $table->text('app_secret')->nullable()->after('app_id');
            $table->string('fb_user_id')->nullable()->after('account_status');
            $table->string('fb_user_name')->nullable()->after('fb_user_id');
            $table->timestamp('token_expires_at')->nullable()->after('last_synced_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_meta_configs', function (Blueprint $table) {
            $table->dropColumn([
                'app_id',
                'app_secret',
                'fb_user_id',
                'fb_user_name',
                'token_expires_at',
            ]);
        });
    }
};
