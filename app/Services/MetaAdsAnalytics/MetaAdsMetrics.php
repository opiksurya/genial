<?php

namespace App\Services\MetaAdsAnalytics;

/**
 * Turns raw Meta insights rows into the figures the Meta Ads page shows.
 */
final class MetaAdsMetrics
{
    /**
     * Meta reports the same conversion under several action types (for example omni_purchase, purchase and
     * the pixel-specific one), so they must never be added together. The first type present wins.
     */
    private const PURCHASE_TYPES = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];

    private const LEAD_TYPES = ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'];

    /**
     * Normalise one insights row.
     *
     * @param  array<string, mixed>  $row
     * @return array{spend: int, revenue: int, impressions: int, clicks: int, purchases: int, leads: int}
     */
    public static function row(array $row): array
    {
        return [
            'spend' => (int) round((float) ($row['spend'] ?? 0)),
            'revenue' => (int) round(self::action($row['action_values'] ?? [], self::PURCHASE_TYPES)),
            'impressions' => (int) ($row['impressions'] ?? 0),
            // The KPI is labelled "link clicks"; fall back to all clicks when Meta does not return them.
            'clicks' => (int) ($row['inline_link_clicks'] ?? $row['clicks'] ?? 0),
            'purchases' => (int) round(self::action($row['actions'] ?? [], self::PURCHASE_TYPES)),
            'leads' => (int) round(self::action($row['actions'] ?? [], self::LEAD_TYPES)),
        ];
    }

    /**
     * One day of the daily series, with derived ratios.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, int|float|string>
     */
    public static function day(string $date, array $row = []): array
    {
        $m = self::row($row);

        return [
            'date' => $date,
            'spend' => $m['spend'],
            'revenue' => $m['revenue'],
            'roas' => self::ratio($m['revenue'], $m['spend']),
            'purchases' => $m['purchases'],
            'leads' => $m['leads'],
            'clicks' => $m['clicks'],
            'impressions' => $m['impressions'],
            'cpc' => $m['clicks'] > 0 ? (int) round($m['spend'] / $m['clicks']) : 0,
            'ctr' => self::ratio($m['clicks'] * 100, $m['impressions']),
        ];
    }

    /**
     * Sum a daily series. Reach is a unique count, so it is passed in from the whole-period figure.
     *
     * @param  list<array<string, mixed>>  $daily
     * @return array<string, int|float>
     */
    public static function totals(array $daily, int $reach = 0): array
    {
        $spend = (int) array_sum(array_column($daily, 'spend'));
        $revenue = (int) array_sum(array_column($daily, 'revenue'));
        $purchases = (int) array_sum(array_column($daily, 'purchases'));
        $leads = (int) array_sum(array_column($daily, 'leads'));
        $clicks = (int) array_sum(array_column($daily, 'clicks'));
        $impressions = (int) array_sum(array_column($daily, 'impressions'));

        return [
            'spend' => $spend,
            'revenue' => $revenue,
            'roas' => self::ratio($revenue, $spend),
            'purchases' => $purchases,
            'leads' => $leads,
            'clicks' => $clicks,
            'impressions' => $impressions,
            'reach' => $reach,
            'cpc' => $clicks > 0 ? (int) round($spend / $clicks) : 0,
            'cpm' => $impressions > 0 ? (int) round(($spend / $impressions) * 1000) : 0,
            'ctr' => self::ratio($clicks * 100, $impressions),
            'cpa' => $purchases > 0 ? (int) round($spend / $purchases) : 0,
            'cpl' => $leads > 0 ? (int) round($spend / $leads) : 0,
        ];
    }

    /**
     * @param  array<string, int|float>  $current
     * @param  array<string, int|float>  $previous
     * @return list<array<string, mixed>>
     */
    public static function kpis(array $current, array $previous): array
    {
        $definitions = [
            ['spend', 'Total Biaya Iklan (Spend)', 'currency', false],
            ['roas', 'Purchase ROAS', 'ratio', true],
            ['revenue', 'Nilai Pembelian (Revenue)', 'currency', true],
            ['purchases', 'Jumlah Pembelian (Purchases)', 'number', true],
            ['cpa', 'Biaya per Pembelian (CPA)', 'currency', false],
            ['leads', 'Prospek Masuk (Leads)', 'number', true],
            ['clicks', 'Klik Tautan (Link Clicks)', 'number', true],
            ['ctr', 'CTR (Rasio Klik-Tayang)', 'percent', true],
        ];

        return array_values(array_map(fn (array $d): array => [
            'key' => $d[0],
            'label' => $d[1],
            'value' => $current[$d[0]],
            'previous' => $previous[$d[0]],
            'change' => $previous[$d[0]] == 0 ? 0 : round((($current[$d[0]] - $previous[$d[0]]) / $previous[$d[0]]) * 100, 1),
            'format' => $d[2],
            'higherIsBetter' => $d[3],
        ], $definitions));
    }

    public static function ratio(int|float $numerator, int|float $denominator, int $precision = 2): float|int
    {
        return $denominator > 0 ? round($numerator / $denominator, $precision) : 0;
    }

    /**
     * Value of the first action type present in the list, in the order given.
     *
     * @param  list<array<string, mixed>>  $entries
     * @param  list<string>  $priority
     */
    private static function action(array $entries, array $priority): float
    {
        $byType = [];
        foreach ($entries as $entry) {
            $byType[$entry['action_type'] ?? ''] = (float) ($entry['value'] ?? 0);
        }

        foreach ($priority as $type) {
            if (array_key_exists($type, $byType)) {
                return $byType[$type];
            }
        }

        return 0.0;
    }
}
