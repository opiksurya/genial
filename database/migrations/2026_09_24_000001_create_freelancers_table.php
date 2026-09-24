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
        Schema::create('freelancers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role')->default('Freelancer'); // Video Editor, Graphic Designer, Copywriter, Voice Over, Web Developer, dll
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('portfolio_link')->nullable();
            $table->decimal('rate_per_project', 15, 2)->default(0);
            $table->string('rate_unit')->default('per_project'); // per_project, per_content, per_hour, per_month
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('access_token', 64)->unique();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('freelancer_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('freelancer_id')->constrained('freelancers')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('brief_link')->nullable(); // Google Drive / Notion / Figma brief
            $table->string('submission_link')->nullable(); // Link hasil kerja dari freelancer
            $table->decimal('fee_amount', 15, 2)->default(0);
            $table->date('deadline')->nullable();
            $table->enum('status', ['assigned', 'in_progress', 'submitted', 'revision', 'completed'])->default('assigned');
            $table->enum('payment_status', ['unpaid', 'paid'])->default('unpaid');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('expense_id')->nullable()->constrained('expenses')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer_assignments');
        Schema::dropIfExists('freelancers');
    }
};
