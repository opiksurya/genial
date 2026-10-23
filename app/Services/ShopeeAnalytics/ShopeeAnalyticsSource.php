<?php

namespace App\Services\ShopeeAnalytics;

use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\Bind;

/**
 * Source of Shopee store analytics. The dummy implementation can later be
 * replaced by a Shopee Open API implementation that returns the same shape,
 * so the controller and the UI stay unchanged.
 */
#[Bind(ShopeeDummyDataService::class)]
interface ShopeeAnalyticsSource
{
    /**
     * Build the full analytics report for the period ending on the given date (inclusive).
     *
     * @return array{
     *     isDummy: bool,
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
