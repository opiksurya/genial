<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use App\Models\Income;
use App\Models\Expense;

class PurgeDummyData extends Command
{
    protected $signature = 'genial:purge-dummy';
    protected $description = 'Hapus semua data dummy BatikKu Indonesia dan GlowingID secara paksa';

    public function handle()
    {
        $this->info('Memulai pembersihan data dummy BatikKu dan GlowingID...');

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } catch (\Exception $e) {}

        // 1. Projects
        $dummyProjects = Project::where('client', 'LIKE', '%Batik%')
            ->orWhere('client', 'LIKE', '%Glowing%')
            ->orWhere('name', 'LIKE', '%E-Commerce Website%')
            ->orWhere('name', 'LIKE', '%SEO & Performance%')
            ->get();

        foreach ($dummyProjects as $p) {
            $this->line("Menghapus project [{$p->id}] {$p->name} ({$p->client})...");
            DB::table('tasks')->where('project_id', $p->id)->delete();
            DB::table('milestones')->where('project_id', $p->id)->delete();
            DB::table('project_members')->where('project_id', $p->id)->delete();
            DB::table('project_credentials')->where('project_id', $p->id)->delete();
            if (\Illuminate\Support\Facades\Schema::hasTable('project_meta_configs')) {
                DB::table('project_meta_configs')->where('project_id', $p->id)->delete();
            }

            // Incomes for this project
            $incIds = Income::where('project_id', $p->id)->pluck('id');
            if ($incIds->isNotEmpty()) {
                Expense::whereIn('income_id', $incIds)->delete();
                if (\Illuminate\Support\Facades\Schema::hasTable('financial_transactions')) {
                    DB::table('financial_transactions')->whereIn('reference_id', $incIds)->where('reference_type', Income::class)->delete();
                }
                Income::whereIn('id', $incIds)->delete();
            }

            Expense::where('project_id', $p->id)->delete();
            $p->delete();
        }

        // 2. Incomes by client name directly
        $dummyIncomes = Income::where('client_name', 'LIKE', '%Batik%')
            ->orWhere('client_name', 'LIKE', '%Glowing%')
            ->get();

        foreach ($dummyIncomes as $inc) {
            $this->line("Menghapus income [{$inc->id}] {$inc->client_name} - {$inc->name}...");
            Expense::where('income_id', $inc->id)->delete();
            if (\Illuminate\Support\Facades\Schema::hasTable('financial_transactions')) {
                DB::table('financial_transactions')->whereIn('reference_id', $inc->id)->where('reference_type', Income::class)->delete();
            }
            $inc->delete();
        }

        // 3. Transactions
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

        $this->info('Sukses! Semua data dummy BatikKu dan GlowingID berhasil dihapus.');
        return 0;
    }
}
