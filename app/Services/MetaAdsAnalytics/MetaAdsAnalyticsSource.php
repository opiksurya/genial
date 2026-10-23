<?php

namespace App\Services\MetaAdsAnalytics;

use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Bind;

/**
 * Source of Meta Ads analytics. Combines live data from MetaClientService
 * with deterministic fallback/simulation data per project.
 */
#[Bind(MetaAdsDataService::class)]
interface MetaAdsAnalyticsSource
{
    /**
     * Build the full Meta Ads analytics report for the requested period.
     *
     * @return array<string, mixed>
     */
    public function report(MetaAdsPeriod $period, CarbonImmutable $endDate, ?Project $project = null): array;
}
