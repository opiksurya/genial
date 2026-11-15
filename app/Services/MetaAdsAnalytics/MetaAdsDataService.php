<?php

namespace App\Services\MetaAdsAnalytics;

use App\Models\Project;
use App\Models\ProjectMetaConfig;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Serves real Meta insights for a project with a connected ad account. A project without one, or whose
 * Meta call failed, gets a report with every number at zero (plus the reason on failure), never invented figures.
 */
class MetaAdsDataService implements MetaAdsAnalyticsSource
{
    public const CACHE_MINUTES = 15;

    private MetaLiveDataService $live;

    public function __construct(?MetaLiveDataService $live = null)
    {
        $this->live = $live ?? app(MetaLiveDataService::class);
    }

    /**
     * Build the full Meta Ads analytics report for the requested period.
     */
    public function report(MetaAdsPeriod $period, CarbonImmutable $endDate, ?Project $project = null): array
    {
        $config = $project?->metaConfig;

        if (! $project || ! $config || ! $config->isConnected() || empty($config->access_token)) {
            return $this->disconnectedReport($period, $endDate, $project);
        }

        $key = sprintf('meta_analytics:%d:%d:%s', $config->id, $period->value, $endDate->toDateString());

        try {
            return Cache::remember($key, now()->addMinutes(self::CACHE_MINUTES), fn (): array => $this->live->report($period, $endDate, $project, $config));
        } catch (MetaApiException $e) {
            Log::warning('Meta live analytics failed', ['project_id' => $project->id, 'code' => $e->metaCode, 'message' => $e->getMessage()]);

            // A dead token will keep failing, so mark the connection and let the page ask for a reconnect.
            if ($e->isAuthError()) {
                $config->update(['status' => 'error', 'error_message' => $e->getMessage()]);
            }

            return [...$this->disconnectedReport($period, $endDate, $project), 'liveError' => $e->getMessage()];
        }
    }

    /**
     * Same shape as a connected report with every number at zero and nothing invented.
     *
     * @return array<string, mixed>
     */
    public function disconnectedReport(MetaAdsPeriod $period, CarbonImmutable $endDate, ?Project $project = null): array
    {
        $numDays = $period->value;
        $startDate = $endDate->subDays($numDays - 1);
        $previousEndDate = $startDate->subDay();
        $previousStartDate = $previousEndDate->subDays($numDays - 1);

        $brandName = $project ? ($project->client ?: $project->name) : 'Belum ada proyek';
        $metaConfig = $project?->metaConfig;

        $daily = [];
        for ($cursor = $startDate; $cursor->lessThanOrEqualTo($endDate); $cursor = $cursor->addDay()) {
            $daily[] = MetaAdsMetrics::day($cursor->toDateString());
        }

        $totals = MetaAdsMetrics::totals($daily);

        $platforms = array_map(fn (array $p): array => [
            'platform' => $p[0], 'label' => $p[1], 'spend' => 0, 'revenue' => 0, 'roas' => 0,
            'purchases' => 0, 'clicks' => 0, 'impressions' => 0, 'share' => 0,
        ], [
            ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['audience_network', 'Audience Network'], ['messenger', 'Messenger'],
        ]);

        $placements = array_map(fn (string $name): array => [
            'name' => $name, 'share' => 0, 'spend' => 0, 'revenue' => 0, 'purchases' => 0, 'roas' => 0,
        ], [
            'Instagram Reels', 'Instagram Feeds', 'Instagram Stories', 'Facebook Feeds', 'Facebook Video Feeds', 'Audience Network & Lainnya',
        ]);

        $ageGroups = array_map(fn (string $age): array => [
            'age' => $age, 'share' => 0, 'spend' => 0, 'purchases' => 0, 'roas' => 0,
        ], ['18–24', '25–34', '35–44', '45–54', '55–64', '65+']);

        $gender = array_map(fn (string $g): array => [
            'gender' => $g, 'share' => 0, 'spend' => 0, 'purchases' => 0,
        ], ['Wanita', 'Pria']);

        $creatives = array_map(fn (string $format): array => [
            'format' => $format, 'hookRate' => null, 'holdRate' => null, 'ctr' => 0, 'spend' => 0, 'revenue' => 0, 'roas' => 0,
        ], ['Video', 'Carousel', 'Gambar']);

        $report = [
            'isConnected' => false,
            'accountName' => $metaConfig?->account_name ?: $brandName,
            'adAccountId' => $metaConfig?->ad_account_id ?: '',
            'pixelId' => $metaConfig?->pixel_id ?: '',
            'currency' => $metaConfig?->currency ?: 'IDR',
            'projectId' => $project?->id,
            'projectName' => $project?->name,
            'clientName' => $project?->client,
            'range' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
                'previousStart' => $previousStartDate->toDateString(),
                'previousEnd' => $previousEndDate->toDateString(),
            ],
            'summary' => [
                'kpis' => MetaAdsMetrics::kpis($totals, $totals),
                'totals' => $totals,
            ],
            'daily' => $daily,
            'platforms' => $platforms,
            'placements' => $placements,
            'campaigns' => [],
            'audiences' => ['ageGroups' => $ageGroups, 'gender' => $gender, 'segments' => []],
            'creatives' => $creatives,
            'pixelHealth' => [
                'pixelId' => $metaConfig?->pixel_id ?: '',
                'status' => 'Belum terhubung',
                'eventMatchQuality' => null,
                'capiActive' => null,
                'lastEventTime' => '',
                'events' => [],
            ],
        ];

        // A connection that was marked broken earlier keeps telling the user why.
        if ($metaConfig instanceof ProjectMetaConfig && $metaConfig->status === 'error' && filled($metaConfig->error_message)) {
            $report['liveError'] = $metaConfig->error_message;
        }

        return $report;
    }
}
