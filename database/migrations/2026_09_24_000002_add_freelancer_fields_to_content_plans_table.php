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
        Schema::table('content_plans', function (Blueprint $table) {
            $table->foreignId('freelancer_id')->nullable()->after('project_id')->constrained('freelancers')->nullOnDelete();
            $table->decimal('freelancer_fee', 15, 2)->default(0)->after('status');
            $table->text('submission_link')->nullable()->after('reference_link');
            $table->text('freelancer_notes')->nullable()->after('submission_link');
            $table->string('freelancer_status')->default('unassigned')->after('status'); // unassigned, assigned, in_progress, submitted, revision, approved
            $table->string('payout_status')->default('unpaid')->after('freelancer_status'); // unpaid, approved, paid
            $table->timestamp('paid_at')->nullable()->after('payout_status');
            $table->foreignId('expense_id')->nullable()->after('paid_at')->constrained('expenses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('content_plans', function (Blueprint $table) {
            $table->dropForeign(['freelancer_id']);
            $table->dropForeign(['expense_id']);
            $table->dropColumn([
                'freelancer_id',
                'freelancer_fee',
                'submission_link',
                'freelancer_notes',
                'freelancer_status',
                'payout_status',
                'paid_at',
                'expense_id',
            ]);
        });
    }
};
