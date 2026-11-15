<?php

namespace App\Console\Commands;

use App\Models\ProjectMetaConfig;
use App\Services\MetaClientService;
use Illuminate\Console\Command;

class MetaResync extends Command
{
    protected $signature = 'meta:resync
        {project? : Only this project (ID or slug), whatever the status of its connections}
        {--all : Also re-check connections that are currently connected}
        {--dry-run : Only ask Meta and report, without saving anything}';

    protected $description = 'Re-check Meta ad account connections that failed (for example after access was granted) and update their status';

    public function handle(): int
    {
        $query = ProjectMetaConfig::with('project:id,name,slug')->orderBy('project_id')->orderByDesc('is_default');

        if ($identifier = $this->argument('project')) {
            $query->whereHas('project', fn ($q) => $q->where('id', $identifier)->orWhere('slug', $identifier));
        } elseif (! $this->option('all')) {
            $query->where('status', 'error');
        }

        $configs = $query->get();

        if ($configs->isEmpty()) {
            $this->info('Tidak ada koneksi Meta yang perlu disinkronkan.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $rows = [];
        $failed = 0;

        foreach ($configs as $config) {
            $before = $config->status;
            $project = $config->project->name;

            if (blank($config->access_token) || blank($config->ad_account_id)) {
                $rows[] = [$project, $config->ad_account_id ?: '-', $before, 'dilewati', 'Token atau ID akun belum diisi.'];
                $failed++;

                continue;
            }

            if ($dryRun) {
                $result = MetaClientService::testConnection($config->ad_account_id, $config->access_token);
            } else {
                $result = MetaClientService::syncAccount($config);
            }

            $result['success'] ?: $failed++;

            $rows[] = [
                $project,
                $config->ad_account_id,
                $before,
                $result['success'] ? ($dryRun ? 'bisa terhubung' : 'connected') : ($dryRun ? 'masih gagal' : 'error'),
                $result['success'] ? '' : mb_strimwidth((string) ($result['message'] ?? ''), 0, 90, '…'),
            ];
        }

        $this->table(['Proyek', 'Akun iklan', 'Sebelum', 'Sesudah', 'Catatan'], $rows);

        $ok = count($rows) - $failed;
        $this->line(sprintf('%d berhasil, %d gagal%s.', $ok, $failed, $dryRun ? ' (dry-run, tidak ada yang disimpan)' : ''));

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
