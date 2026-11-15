<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Services\MetaAdsAnalytics\MetaApiException;
use App\Services\MetaAdsAnalytics\MetaInsightsFetcher;
use Illuminate\Console\Command;

class MetaSmokeTest extends Command
{
    protected $signature = 'meta:smoke-test {project : Project ID or slug} {--days=7 : Number of days to read}';

    protected $description = 'Call every Meta insights read the analytics page uses, for one connected project, and report which work';

    public function handle(MetaInsightsFetcher $fetcher): int
    {
        $project = Project::where('id', $this->argument('project'))
            ->orWhere('slug', $this->argument('project'))
            ->first();

        $config = $project?->metaConfig;

        if (! $config || ! $config->isConnected() || empty($config->access_token)) {
            $this->error('Proyek tidak ditemukan atau akun Meta belum terhubung.');

            return self::FAILURE;
        }

        $until = now()->subDay()->toDateString();
        $since = now()->subDays(max(1, (int) $this->option('days')))->toDateString();

        $this->line(sprintf('Akun %s (%s), %s s/d %s', $config->account_name ?: '-', $config->ad_account_id, $since, $until));

        $calls = [
            'insights harian' => fn () => count($fetcher->daily($config, $since, $until)).' baris',
            'jangkauan (reach)' => fn () => 'reach '.($fetcher->totals($config, $since, $until)['reach'] ?? 0),
            'platform' => fn () => count($fetcher->breakdown($config, $since, $until, 'publisher_platform')).' baris',
            'placement' => fn () => count($fetcher->breakdown($config, $since, $until, 'publisher_platform,platform_position')).' baris',
            'usia' => fn () => count($fetcher->breakdown($config, $since, $until, 'age')).' baris',
            'gender' => fn () => count($fetcher->breakdown($config, $since, $until, 'gender')).' baris',
            'kampanye' => fn () => count($fetcher->campaigns($config, $since, $until)).' kampanye',
            'iklan dan kreatif' => fn () => count($fetcher->ads($config, $since, $until)).' iklan',
            'pixel' => fn () => ($pixel = $fetcher->pixel($config, $since, $until)) === null
                ? 'tidak ada atau tidak terbaca'
                : count($pixel['events']).' jenis event',
        ];

        $failures = 0;

        foreach ($calls as $name => $call) {
            try {
                $this->info(sprintf('  OK   %-20s %s', $name, $call()));
            } catch (MetaApiException $e) {
                $failures++;
                $this->error(sprintf('  FAIL %-20s %s%s', $name, $e->metaCode ? "[{$e->metaCode}] " : '', $e->getMessage()));
            }
        }

        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }
}
