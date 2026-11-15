<?php

namespace App\Console\Commands;

use App\Models\ProjectMetaConfig;
use App\Services\MetaClientService;
use Illuminate\Console\Command;

use function Laravel\Prompts\password;

class MetaConnectAll extends Command
{
    protected $signature = 'meta:connect-all
        {--app-id= : Meta App ID (opsional, disimpan ke setiap config)}
        {--app-secret= : Meta App Secret (opsional)}
        {--token-file= : Path file berisi token (dihapus setelah dipakai kecuali --keep-file)}
        {--keep-file : Jangan hapus file token setelah dipakai}';

    protected $description = 'Pasang satu System User / long-lived token ke semua ad account project, lalu sinkronkan.';

    public function handle(): int
    {
        $token = $this->readToken();

        if (blank($token)) {
            $this->error('Token kosong.');

            return self::FAILURE;
        }

        $rows = [];
        $this->line('Token terbaca (' . strlen($token) . ' karakter).');

        foreach (ProjectMetaConfig::with('project:id,name')->get() as $config) {
            $config->access_token = trim($token);
            if ($this->option('app-id')) {
                $config->app_id = trim($this->option('app-id'));
            }
            if ($this->option('app-secret')) {
                $config->app_secret = trim($this->option('app-secret'));
            }
            $config->save();

            $result = MetaClientService::syncAccount($config);
            $rows[] = [
                $config->project?->name,
                $config->ad_account_id,
                $result['success'] ? 'connected' : 'ERROR',
                $result['success'] ? '' : mb_strimwidth($result['message'], 0, 60, '…'),
            ];
        }

        $this->table(['Project', 'Ad account', 'Status', 'Catatan'], $rows);

        $file = $this->option('token-file');
        if ($file && ! $this->option('keep-file') && is_file($file)) {
            unlink($file);
            $this->info("File token {$file} dihapus.");
        }

        return self::SUCCESS;
    }

    private function readToken(): string
    {
        if ($file = $this->option('token-file')) {
            return is_readable($file) ? trim((string) file_get_contents($file)) : '';
        }

        if (! stream_isatty(STDIN)) {
            return trim((string) stream_get_contents(STDIN));
        }

        return trim((string) password('Tempel access token Meta (tidak ditampilkan)'));
    }
}
