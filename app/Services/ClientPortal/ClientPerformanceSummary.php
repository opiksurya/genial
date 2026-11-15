<?php

namespace App\Services\ClientPortal;

use App\Models\Project;
use App\Services\MetaAdsAnalytics\MetaAdsAnalyticsSource;
use App\Services\MetaAdsAnalytics\MetaAdsPeriod;
use App\Services\ShopeeAnalytics\ShopeeAnalyticsSource;
use App\Services\ShopeeAnalytics\ShopeePeriod;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Small, cached 30-day performance snapshot (Shopee + Meta Ads) for the client dashboard.
 */
final class ClientPerformanceSummary
{
    private const CACHE_SECONDS = 300;

    public function __construct(
        private readonly ShopeeAnalyticsSource $shopee,
        private readonly MetaAdsAnalyticsSource $meta,
    ) {}

    /**
     * @return array{
     *     shopee: array{isConnected: bool, revenue: int|float|null, orders: int|null, roas: float|null},
     *     meta: array{isConnected: bool, spend: int|null, revenue: int|null, roas: float|null, purchases: int|null}
     * }
     */
    public function forProject(Project $project): array
    {
        return Cache::remember(
            'client-portal.performance.'.$project->id,
            self::CACHE_SECONDS,
            fn (): array => [
                'shopee' => $this->shopeeSummary($project),
                'meta' => $this->metaSummary($project),
            ],
        );
    }

    /**
     * @return array{isConnected: bool, revenue: int|float|null, orders: int|null, roas: float|null}
     */
    private function shopeeSummary(Project $project): array
    {
        $empty = ['isConnected' => false, 'revenue' => null, 'orders' => null, 'roas' => null];

        try {
            $report = $this->shopee->report(ShopeePeriod::Last30Days, CarbonImmutable::yesterday(), $project);

            if (! $report['isConnected']) {
                return $empty;
            }

            $values = [];
            $kpis = $report['summary']['kpis'] ?? [];
            foreach (is_array($kpis) ? $kpis : [] as $kpi) {
                if (is_array($kpi) && isset($kpi['key']) && is_string($kpi['key'])) {
                    $values[$kpi['key']] = $kpi['value'] ?? null;
                }
            }

            return [
                'isConnected' => true,
                'revenue' => $this->number($values['revenue'] ?? null),
                'orders' => $this->integer($values['orders'] ?? null),
                'roas' => $this->float($values['roas'] ?? null),
            ];
        } catch (Throwable $e) {
            Log::warning('Client portal Shopee summary failed', ['project_id' => $project->id, 'error' => $e->getMessage()]);

            return $empty;
        }
    }

    /**
     * @return array{isConnected: bool, spend: int|null, revenue: int|null, roas: float|null, purchases: int|null}
     */
    private function metaSummary(Project $project): array
    {
        $empty = ['isConnected' => false, 'spend' => null, 'revenue' => null, 'roas' => null, 'purchases' => null];

        try {
            $report = $this->meta->report(MetaAdsPeriod::Last30Days, CarbonImmutable::yesterday(), $project);

            if (empty($report['isConnected'])) {
                return $empty;
            }

            $totals = $report['summary']['totals'] ?? [];
            $totals = is_array($totals) ? $totals : [];

            return [
                'isConnected' => true,
                'spend' => $this->integer($totals['spend'] ?? null),
                'revenue' => $this->integer($totals['revenue'] ?? null),
                'roas' => $this->float($totals['roas'] ?? null),
                'purchases' => $this->integer($totals['purchases'] ?? null),
            ];
        } catch (Throwable $e) {
            Log::warning('Client portal Meta summary failed', ['project_id' => $project->id, 'error' => $e->getMessage()]);

            return $empty;
        }
    }

    private function number(mixed $value): int|float|null
    {
        return is_int($value) || is_float($value) ? $value : (is_numeric($value) ? $value + 0 : null);
    }

    private function integer(mixed $value): ?int
    {
        return is_numeric($value) ? (int) round((float) $value) : null;
    }

    private function float(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }
}
