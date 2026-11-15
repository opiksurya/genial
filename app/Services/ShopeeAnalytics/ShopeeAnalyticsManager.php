<?php

namespace App\Services\ShopeeAnalytics;

use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Services\Shopee\ShopeeApiException;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Serves real Shopee data for connected shops, and the simulation for projects without a connection.
 * If the live call fails the simulation is shown together with the reason, never silently.
 */
class ShopeeAnalyticsManager implements ShopeeAnalyticsSource
{
    public const int CACHE_MINUTES = 15;

    public function __construct(
        private ShopeeLiveDataService $live,
        private ShopeeDummyDataService $dummy,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function report(ShopeePeriod $period, CarbonImmutable $endDate, ?Project $project = null): array
    {
        // The controller loads a column-limited config for the UI; credentials need the full row.
        $config = $project ? ProjectShopeeConfig::where('project_id', $project->id)->first() : null;

        if (! $project || ! $config || ! $config->isConnected() || ! $config->hasCredentials()) {
            return $this->dummy->report($period, $endDate, $project);
        }

        $key = sprintf('shopee_analytics:%d:%s:%d:%s', $project->id, $config->shop_id, $period->value, $endDate->toDateString());

        try {
            return Cache::remember($key, now()->addMinutes(self::CACHE_MINUTES), fn (): array => $this->live->report($period, $endDate, $project, $config));
        } catch (ShopeeApiException $e) {
            Log::warning('Shopee live analytics failed', ['project_id' => $project->id, 'message' => $e->getMessage(), 'code' => $e->errorCode]);

            return [...$this->dummy->report($period, $endDate, $project), 'liveError' => $e->getMessage()];
        }
    }
}
