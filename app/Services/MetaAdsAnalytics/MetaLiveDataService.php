<?php

namespace App\Services\MetaAdsAnalytics;

use App\Models\Project;
use App\Models\ProjectMetaConfig;
use Carbon\CarbonImmutable;

/**
 * Meta Ads analytics built from the connected ad account's real insights, in the shape the page expects.
 *
 * The daily series is the backbone: if it cannot be read the whole report fails. The breakdowns, campaigns,
 * creatives and pixel are optional: when one of them fails the section is left empty and named in
 * meta.partial, except for token problems, which always fail the report.
 */
class MetaLiveDataService
{
    private const PLATFORM_LABELS = [
        'instagram' => 'Instagram',
        'facebook' => 'Facebook',
        'audience_network' => 'Audience Network',
        'messenger' => 'Messenger',
        'whatsapp' => 'WhatsApp',
        'threads' => 'Threads',
    ];

    private const POSITION_LABELS = [
        'feed' => 'Feeds',
        'story' => 'Stories',
        'reels' => 'Reels',
        'video_feeds' => 'Video Feeds',
        'instream_video' => 'In-Stream Video',
        'right_hand_column' => 'Right Column',
        'marketplace' => 'Marketplace',
        'search' => 'Search',
        'profile_feed' => 'Profile Feed',
        'an_classic' => 'Classic',
        'rewarded_video' => 'Rewarded Video',
        'instagram_explore' => 'Explore',
        'instagram_explore_grid_home' => 'Explore Home',
    ];

    private const GENDER_LABELS = ['female' => 'Wanita', 'male' => 'Pria', 'unknown' => 'Tidak diketahui'];

    private const TOP_PLACEMENTS = 6;

    private const MAX_CAMPAIGNS = 50;

    public function __construct(private MetaInsightsFetcher $fetcher) {}

    /**
     * @return array<string, mixed>
     *
     * @throws MetaApiException
     */
    public function report(MetaAdsPeriod $period, CarbonImmutable $endDate, Project $project, ProjectMetaConfig $config): array
    {
        $end = $endDate->startOfDay();
        $start = $end->subDays($period->value - 1);
        $previousEnd = $start->subDay();
        $previousStart = $previousEnd->subDays($period->value - 1);

        [$since, $until] = [$start->toDateString(), $end->toDateString()];

        $rows = $this->fetcher->daily($config, $previousStart->toDateString(), $until);
        $byDate = [];
        foreach ($rows as $row) {
            $byDate[(string) ($row['date_start'] ?? '')] = $row;
        }

        $currentDaily = $this->series($byDate, $start, $end);
        $previousDaily = $this->series($byDate, $previousStart, $previousEnd);

        $partial = [];
        $reach = (int) ($this->optional($partial, 'reach', fn () => $this->fetcher->totals($config, $since, $until), [])['reach'] ?? 0);
        $platformRows = $this->optional($partial, 'platform', fn () => $this->fetcher->breakdown($config, $since, $until, 'publisher_platform'), []);
        $placementRows = $this->optional($partial, 'placement', fn () => $this->fetcher->breakdown($config, $since, $until, 'publisher_platform,platform_position'), []);
        $ageRows = $this->optional($partial, 'audience', fn () => $this->fetcher->breakdown($config, $since, $until, 'age'), []);
        $genderRows = $this->optional($partial, 'audience', fn () => $this->fetcher->breakdown($config, $since, $until, 'gender'), []);
        $campaignRows = $this->optional($partial, 'campaigns', fn () => $this->fetcher->campaigns($config, $since, $until), []);
        $adRows = $this->optional($partial, 'creatives', fn () => $this->fetcher->ads($config, $since, $until), []);
        $pixel = $this->optional($partial, 'pixel', fn () => $this->fetcher->pixel($config, $since, $until), null);

        $currentTotals = MetaAdsMetrics::totals($currentDaily, $reach);
        $previousTotals = MetaAdsMetrics::totals($previousDaily);
        $brand = $project->client ?: $project->name;

        return [
            'isConnected' => true,
            'accountName' => $config->account_name ?: $brand,
            'adAccountId' => (string) $config->ad_account_id,
            'pixelId' => (string) $config->pixel_id,
            'currency' => $config->currency ?: 'IDR',
            'projectId' => $project->id,
            'projectName' => $project->name,
            'clientName' => $project->client,
            'range' => [
                'start' => $since,
                'end' => $until,
                'previousStart' => $previousStart->toDateString(),
                'previousEnd' => $previousEnd->toDateString(),
            ],
            'summary' => [
                'kpis' => MetaAdsMetrics::kpis($currentTotals, $previousTotals),
                'totals' => $currentTotals,
            ],
            'daily' => $currentDaily,
            'platforms' => $this->platforms($platformRows),
            'placements' => $this->placements($placementRows),
            'campaigns' => $this->campaigns($campaignRows),
            'audiences' => [
                'ageGroups' => $this->ageGroups($ageRows),
                'gender' => $this->genders($genderRows),
                // Custom and lookalike audiences are not part of account insights.
                'segments' => [],
            ],
            'creatives' => $this->creatives($adRows),
            'pixelHealth' => $this->pixelHealth($config, $pixel),
            'meta' => [
                'partial' => array_values(array_unique($partial)),
                'generatedAt' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Run an optional section. Token problems still fail the whole report; anything else just empties the section.
     *
     * @template T
     *
     * @param  list<string>  $partial
     * @param  callable(): T  $load
     * @param  T  $fallback
     * @return T
     *
     * @throws MetaApiException
     */
    private function optional(array &$partial, string $section, callable $load, mixed $fallback): mixed
    {
        try {
            return $load();
        } catch (MetaApiException $e) {
            if ($e->isAuthError()) {
                throw $e;
            }

            $partial[] = $section;

            return $fallback;
        }
    }

    /**
     * Every day in the range, zero when Meta returned nothing for that day.
     *
     * @param  array<string, array<string, mixed>>  $byDate
     * @return list<array<string, mixed>>
     */
    private function series(array $byDate, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $days = [];
        for ($date = $from; $date->lessThanOrEqualTo($to); $date = $date->addDay()) {
            $days[] = MetaAdsMetrics::day($date->toDateString(), $byDate[$date->toDateString()] ?? []);
        }

        return $days;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function platforms(array $rows): array
    {
        $grouped = [];
        foreach (['instagram', 'facebook', 'audience_network', 'messenger'] as $base) {
            $grouped[$base] = $this->blank();
        }
        foreach ($rows as $row) {
            $this->add($grouped, (string) ($row['publisher_platform'] ?? 'unknown'), $row);
        }

        uasort($grouped, fn (array $a, array $b): int => $b['spend'] <=> $a['spend']);
        $total = array_sum(array_column($grouped, 'spend'));

        $platforms = [];
        foreach ($grouped as $key => $g) {
            $platforms[] = [
                'platform' => $key,
                'label' => $this->platformLabel($key),
                'spend' => $g['spend'],
                'revenue' => $g['revenue'],
                'roas' => MetaAdsMetrics::ratio($g['revenue'], $g['spend']),
                'purchases' => $g['purchases'],
                'clicks' => $g['clicks'],
                'impressions' => $g['impressions'],
                'share' => (float) MetaAdsMetrics::ratio($g['spend'] * 100, $total, 1),
            ];
        }

        return $platforms;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function placements(array $rows): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $platform = (string) ($row['publisher_platform'] ?? 'unknown');
            $position = (string) ($row['platform_position'] ?? 'unknown');
            $this->add($grouped, $this->platformLabel($platform).' '.$this->positionLabel($position), $row);
        }

        uasort($grouped, fn (array $a, array $b): int => $b['spend'] <=> $a['spend']);
        $total = array_sum(array_column($grouped, 'spend'));

        $top = array_slice($grouped, 0, self::TOP_PLACEMENTS, true);
        $rest = array_slice($grouped, self::TOP_PLACEMENTS, null, true);
        if ($rest !== []) {
            $other = $this->blank();
            foreach ($rest as $g) {
                foreach ($other as $field => $_) {
                    $other[$field] += $g[$field];
                }
            }
            $top['Penempatan Lainnya'] = $other;
        }

        $placements = [];
        foreach ($top as $name => $g) {
            $placements[] = [
                'name' => (string) $name,
                'share' => (float) MetaAdsMetrics::ratio($g['spend'] * 100, $total, 1),
                'spend' => $g['spend'],
                'revenue' => $g['revenue'],
                'purchases' => $g['purchases'],
                'roas' => MetaAdsMetrics::ratio($g['revenue'], $g['spend']),
            ];
        }

        return $placements;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function ageGroups(array $rows): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $this->add($grouped, str_replace('-', '–', (string) ($row['age'] ?? 'Tidak diketahui')), $row);
        }

        ksort($grouped);
        $total = array_sum(array_column($grouped, 'spend'));

        $groups = [];
        foreach ($grouped as $age => $g) {
            $groups[] = [
                'age' => (string) $age,
                'share' => (float) MetaAdsMetrics::ratio($g['spend'] * 100, $total, 1),
                'spend' => $g['spend'],
                'purchases' => $g['purchases'],
                'roas' => MetaAdsMetrics::ratio($g['revenue'], $g['spend']),
            ];
        }

        return $groups;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function genders(array $rows): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $key = (string) ($row['gender'] ?? 'unknown');
            $this->add($grouped, self::GENDER_LABELS[$key] ?? ucfirst($key), $row);
        }

        uasort($grouped, fn (array $a, array $b): int => $b['spend'] <=> $a['spend']);
        $total = array_sum(array_column($grouped, 'spend'));

        $genders = [];
        foreach ($grouped as $label => $g) {
            $genders[] = [
                'gender' => (string) $label,
                'share' => (float) MetaAdsMetrics::ratio($g['spend'] * 100, $total, 1),
                'spend' => $g['spend'],
                'purchases' => $g['purchases'],
            ];
        }

        return $genders;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function campaigns(array $rows): array
    {
        $campaigns = [];
        foreach ($rows as $c) {
            $m = MetaAdsMetrics::row($c['insights']['data'][0] ?? []);
            $active = ($c['effective_status'] ?? '') === 'ACTIVE';

            // Old campaigns with nothing in this period would only add noise.
            if (! $active && $m['spend'] === 0 && $m['impressions'] === 0) {
                continue;
            }

            $campaigns[] = [
                'id' => (string) $c['id'],
                'name' => (string) ($c['name'] ?? ''),
                'status' => $active ? 'ACTIVE' : 'PAUSED',
                'objective' => (string) ($c['objective'] ?? 'UNKNOWN'),
                // Shown exactly as Meta returns it (the currency's smallest unit).
                'dailyBudget' => (int) ($c['daily_budget'] ?? 0),
                'spend' => $m['spend'],
                'revenue' => $m['revenue'],
                'roas' => MetaAdsMetrics::ratio($m['revenue'], $m['spend']),
                'impressions' => $m['impressions'],
                'clicks' => $m['clicks'],
                'ctr' => MetaAdsMetrics::ratio($m['clicks'] * 100, $m['impressions']),
                'cpc' => $m['clicks'] > 0 ? (int) round($m['spend'] / $m['clicks']) : 0,
                'purchases' => $m['purchases'],
                'leads' => $m['leads'],
                'cpa' => $m['purchases'] > 0 ? (int) round($m['spend'] / $m['purchases']) : 0,
            ];
        }

        usort($campaigns, fn (array $a, array $b): int => $b['spend'] <=> $a['spend']);

        return array_slice($campaigns, 0, self::MAX_CAMPAIGNS);
    }

    /**
     * Performance per creative format. Hook and hold rates need video metrics that are not requested here.
     *
     * @param  list<array<string, mixed>>  $ads
     * @return list<array<string, mixed>>
     */
    private function creatives(array $ads): array
    {
        $grouped = [];
        foreach ($ads as $ad) {
            $insight = $ad['insights']['data'][0] ?? null;
            if ($insight === null) {
                continue;
            }
            $this->add($grouped, $this->creativeFormat($ad['creative'] ?? []), $insight);
        }

        uasort($grouped, fn (array $a, array $b): int => $b['spend'] <=> $a['spend']);

        $creatives = [];
        foreach ($grouped as $format => $g) {
            $creatives[] = [
                'format' => (string) $format,
                'hookRate' => null,
                'holdRate' => null,
                'ctr' => MetaAdsMetrics::ratio($g['clicks'] * 100, $g['impressions']),
                'spend' => $g['spend'],
                'revenue' => $g['revenue'],
                'roas' => MetaAdsMetrics::ratio($g['revenue'], $g['spend']),
            ];
        }

        return $creatives;
    }

    /**
     * @param  array<string, mixed>  $creative
     */
    private function creativeFormat(array $creative): string
    {
        $spec = $creative['object_story_spec'] ?? [];
        $linkData = $spec['link_data'] ?? [];

        return match (true) {
            ! empty($linkData['child_attachments']) => 'Carousel',
            ! empty($creative['video_id']) || ($creative['object_type'] ?? '') === 'VIDEO' || isset($spec['video_data']) => 'Video',
            ($creative['object_type'] ?? '') === 'PHOTO' || isset($spec['photo_data']) || ! empty($linkData['image_hash']) || ! empty($linkData['picture']) => 'Gambar',
            default => 'Lainnya',
        };
    }

    /**
     * @param  array{name: ?string, lastFiredTime: ?string, isUnavailable: bool, events: array<string, int>, methods: array<string, int>}|null  $pixel
     * @return array<string, mixed>
     */
    private function pixelHealth(ProjectMetaConfig $config, ?array $pixel): array
    {
        $base = [
            'pixelId' => (string) $config->pixel_id,
            'eventMatchQuality' => null,
            'capiActive' => null,
            'lastEventTime' => '',
            'events' => [],
        ];

        if (blank($config->pixel_id)) {
            return [...$base, 'status' => 'Belum diatur'];
        }

        if ($pixel === null) {
            return [...$base, 'status' => 'Tidak terbaca'];
        }

        $last = $pixel['lastFiredTime'] ? CarbonImmutable::parse($pixel['lastFiredTime']) : null;
        $status = match (true) {
            $pixel['isUnavailable'] => 'Tidak tersedia',
            $last === null => 'Belum ada event',
            $last->greaterThan(now()->subDay()) => 'Aktif',
            $last->greaterThan(now()->subDays(7)) => 'Jarang aktif',
            default => 'Tidak aktif',
        };

        $events = [];
        foreach ($pixel['events'] as $name => $count) {
            $events[] = ['name' => (string) $name, 'count' => $count, 'matchRate' => null];
        }

        return [
            ...$base,
            'status' => $status,
            // Event Match Quality is only available in Events Manager, so it is not guessed here.
            'capiActive' => $pixel['methods'] === [] ? null : (($pixel['methods']['server'] ?? 0) > 0),
            'lastEventTime' => $last?->toIso8601String() ?? '',
            'events' => $events,
        ];
    }

    /**
     * @return array{spend: int, revenue: int, purchases: int, clicks: int, impressions: int}
     */
    private function blank(): array
    {
        return ['spend' => 0, 'revenue' => 0, 'purchases' => 0, 'clicks' => 0, 'impressions' => 0];
    }

    /**
     * Add an insights row to the group with the given key.
     *
     * @param  array<string, array<string, int>>  $grouped
     * @param  array<string, mixed>  $row
     */
    private function add(array &$grouped, string $key, array $row): void
    {
        $grouped[$key] ??= $this->blank();
        $m = MetaAdsMetrics::row($row);

        foreach ($this->blank() as $field => $_) {
            $grouped[$key][$field] += $m[$field];
        }
    }

    private function platformLabel(string $key): string
    {
        return self::PLATFORM_LABELS[$key] ?? ucwords(str_replace('_', ' ', $key));
    }

    private function positionLabel(string $key): string
    {
        return self::POSITION_LABELS[$key] ?? ucwords(str_replace('_', ' ', $key));
    }
}
