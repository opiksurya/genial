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
        Schema::create('project_shopee_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete()->unique();

            // Shopee Open Platform Developer Credentials
            $table->string('partner_id')->nullable();
            $table->text('partner_key')->nullable(); // Encrypted HMAC-SHA256 signature secret
            $table->boolean('is_sandbox')->default(false);

            // Authorized Shop Information (OAuth 2.0)
            $table->string('shop_id')->nullable();
            $table->string('shop_name')->nullable();
            $table->text('access_token')->nullable(); // Encrypted access token
            $table->text('refresh_token')->nullable(); // Encrypted refresh token
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamp('refresh_expires_at')->nullable();

            // Status & Diagnostics
            $table->string('status')->default('disconnected'); // 'connected', 'disconnected', 'error'
            $table->timestamp('last_synced_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('shopee_raw_data')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_shopee_configs');
    }
};
