<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } catch (\Exception $e) {}

        // 1. Find all project IDs matching dummy names
        $dummyProjectIds = DB::table('projects')
            ->where('client', 'LIKE', '%Batik%')
            ->orWhere('client', 'LIKE', '%Glowing%')
            ->orWhere('name', 'LIKE', '%E-Commerce Website%')
            ->orWhere('name', 'LIKE', '%SEO & Performance%')
            ->pluck('id');

        if ($dummyProjectIds->isNotEmpty()) {
            DB::table('tasks')->whereIn('project_id', $dummyProjectIds)->delete();
            DB::table('milestones')->whereIn('project_id', $dummyProjectIds)->delete();
            DB::table('project_members')->whereIn('project_id', $dummyProjectIds)->delete();
            DB::table('project_credentials')->whereIn('project_id', $dummyProjectIds)->delete();
            if (\Illuminate\Support\Facades\Schema::hasTable('project_meta_configs')) {
                DB::table('project_meta_configs')->whereIn('project_id', $dummyProjectIds)->delete();
            }
            
            // Delete expenses linked to these projects
            DB::table('expenses')->whereIn('project_id', $dummyProjectIds)->delete();

            // Delete incomes linked to these projects
            $incomeIds = DB::table('incomes')->whereIn('project_id', $dummyProjectIds)->pluck('id');
            if ($incomeIds->isNotEmpty()) {
                DB::table('expenses')->whereIn('income_id', $incomeIds)->delete();
                if (\Illuminate\Support\Facades\Schema::hasTable('financial_transactions')) {
                    DB::table('financial_transactions')->whereIn('reference_id', $incomeIds)->where('reference_type', 'App\\Models\\Income')->delete();
                }
                DB::table('incomes')->whereIn('id', $incomeIds)->delete();
            }

            DB::table('projects')->whereIn('id', $dummyProjectIds)->delete();
        }

        // 2. Also delete any incomes/expenses explicitly for BatikKu or GlowingID
        $remainingIncomeIds = DB::table('incomes')
            ->where('client_name', 'LIKE', '%Batik%')
            ->orWhere('client_name', 'LIKE', '%Glowing%')
            ->pluck('id');

        if ($remainingIncomeIds->isNotEmpty()) {
            DB::table('expenses')->whereIn('income_id', $remainingIncomeIds)->delete();
            if (\Illuminate\Support\Facades\Schema::hasTable('financial_transactions')) {
                DB::table('financial_transactions')->whereIn('reference_id', $remainingIncomeIds)->where('reference_type', 'App\\Models\\Income')->delete();
            }
            DB::table('incomes')->whereIn('id', $remainingIncomeIds)->delete();
        }

        // Clean any leftover dummy financial transactions
        if (\Illuminate\Support\Facades\Schema::hasTable('financial_transactions')) {
            DB::table('financial_transactions')
                ->where('activity_name', 'LIKE', '%BatikKu%')
                ->orWhere('activity_name', 'LIKE', '%Glowing%')
                ->orWhere('activity_name', 'LIKE', '%Client Website Project%')
                ->delete();
        }

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } catch (\Exception $e) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to restore dummy data
    }
};
