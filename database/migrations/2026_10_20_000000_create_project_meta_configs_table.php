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
        Schema::create('project_meta_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->cascadeOnDelete();
            $table->string('ad_account_id')->nullable();
            $table->string('pixel_id')->nullable();
            $table->text('access_token')->nullable();
            $table->string('account_name')->nullable();
            $table->string('currency', 10)->default('IDR')->nullable();
            $table->string('timezone_name')->default('Asia/Jakarta')->nullable();
            $table->integer('account_status')->nullable();
            $table->string('status', 30)->default('disconnected'); // disconnected, connected, error
            $table->timestamp('last_synced_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('meta_raw_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_meta_configs');
    }
};
