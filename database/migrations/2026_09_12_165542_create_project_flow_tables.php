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
        // 1. Projects Table
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('client');
            $table->text('description')->nullable();
            $table->string('category')->default('Website Development');
            $table->string('status')->default('Planning'); // Planning, In Progress, Review, Completed, Archived
            $table->string('priority')->default('Medium'); // Low, Medium, High, Urgent
            $table->integer('progress')->default(0); // 0-100%
            $table->date('start_date');
            $table->date('end_date');
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 2. Project Members Table
        Schema::create('project_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->default('Developer'); // Project Manager, Designer, Developer, Ads Specialist, SEO Specialist, Content Writer
            $table->timestamps();
        });

        // 3. Tasks Table
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('PLANNING'); // BACKLOG, PLANNING, IN_PROGRESS, REVIEW, DONE
            $table->string('priority')->default('Medium'); // Low, Medium, High, Urgent
            $table->string('label')->nullable();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('assignee_role')->nullable();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // 4. Task Comments Table
        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('comment');
            $table->timestamps();
        });

        // 5. Task Checklists Table
        Schema::create('task_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });

        // 6. Milestones Table
        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->date('due_date');
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });

        // 7. Task Dependencies Table
        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('depends_on_task_id')->constrained('tasks')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
        Schema::dropIfExists('milestones');
        Schema::dropIfExists('task_checklists');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('project_members');
        Schema::dropIfExists('projects');
    }
};
