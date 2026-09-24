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
        Schema::create('content_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->string('brand_name')->nullable();
            $table->string('title');
            $table->date('scheduled_date');
            $table->string('scheduled_time')->nullable()->default('19:00');
            $table->string('platform')->default('TikTok'); // TikTok, Shopee Video, Instagram Reels, YouTube Shorts, Instagram Feed
            $table->string('format')->default('Video'); // Video, Carousel, Image, Single Post, Story
            $table->string('pillar')->default('Product Showcase'); // Product Showcase, Edukasi, Behind The Scene, Promo, Testimonial, Tren
            $table->string('status')->default('Draft'); // Draft, In Progress, Scheduled, Published
            $table->text('reference_link')->nullable();
            $table->text('visual_detail')->nullable();
            $table->text('wording')->nullable();
            $table->text('copywriting')->nullable();
            $table->text('hashtags')->nullable();
            $table->text('notes')->nullable();
            $table->json('meta_data')->nullable();
            $table->timestamps();

            $table->index(['scheduled_date', 'platform']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_plans');
    }
};
