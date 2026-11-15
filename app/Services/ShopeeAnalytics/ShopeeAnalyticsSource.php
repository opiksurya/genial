<?php

namespace App\Services\ShopeeAnalytics;

use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Bind;

/**
 * Source of Shopee store analytics. The manager serves live Shopee Open API data for
 * connected shops and an all-zero report for everything else, in the same shape.
 */
#[Bind(ShopeeAnalyticsManager::class)]
interface ShopeeAnalyticsSource
{
    /**
     * Build the full analytics report for the period ending on the given date (inclusive).
     *
     * @return array{
     *     isConnected: bool,
     *     storeName: string,
     *     projectId: int|null,
     *     projectName: string|null,
     *     clientName: string|null,
     *     range: array<string, string>,
     *     summary: array<string, mixed>,
     *     sales: array<string, mixed>,
     *     ads: array<string, mixed>,
     *     content: array<string, mixed>,
     *     storefront: array<string, mixed>
     * }
     */
    public function report(ShopeePeriod $period, CarbonImmutable $endDate, ?Project $project = null): array;
}
