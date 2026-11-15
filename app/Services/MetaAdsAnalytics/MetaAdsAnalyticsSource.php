<?php

namespace App\Services\MetaAdsAnalytics;

use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Bind;

/**
 * Source of Meta Ads analytics. A project without a connected Meta account gets a report with every
 * number at zero. For a connected account only the campaign list comes from MetaClientService; the other
 * figures are still produced by a deterministic generator until real insights are wired in.
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
