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
        Schema::create('creative_services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // Video Production, Photo & Design, UGC & Talent, Copywriting & Script, Motion & 3D, Live Streaming
            $table->string('format')->default('Video'); // Video, Carousel, Image, Story, Script, VoiceOver, Live, Other
            $table->text('description')->nullable();
            $table->text('deliverables')->nullable(); // Spek output, resolusi, durasi, dll
            $table->decimal('client_price', 15, 2)->default(0); // Harga Jual ke Klien
            $table->decimal('freelancer_cost', 15, 2)->default(0); // Standar Upah Freelancer
            $table->string('unit')->default('per item'); // per video, per 10 foto, per carousel, per script, per sesi
            $table->integer('turnaround_days')->default(2); // Estimasi pengerjaan (hari)
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['category', 'format']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('creative_services');
    }
};
