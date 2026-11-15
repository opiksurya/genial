<?php

namespace App\Services\MetaAdsAnalytics;

use App\Models\ProjectMetaConfig;
use App\Services\MetaClientService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Reads performance data for one ad account from the Meta Marketing API (Graph API).
 * Dates are passed as Y-m-d strings and are interpreted by Meta in the ad account's own timezone.
 */
class MetaInsightsFetcher
{
    private const TIMEOUT_SECONDS = 30;

    private const MAX_PAGES = 5;

    private const METRIC_FIELDS = 'spend,impressions,clicks,inline_link_clicks,actions,action_values';

    /**
     * One row per day for the whole range.
     *
     * @return list<array<string, mixed>>
     *
     * @throws MetaApiException
     */
    public function daily(ProjectMetaConfig $config, string $since, string $until): array
    {
        return $this->paged($config, '/insights', [
            'level' => 'account',
            'time_increment' => 1,
            'time_range' => $this->range($since, $until),
            'fields' => self::METRIC_FIELDS,
            'limit' => 500,
        ]);
    }

    /**
     * Whole-period figures that cannot be summed from daily rows, such as unique reach.
     *
     * @return array<string, mixed>
     *
     * @throws MetaApiException
     */
    public function totals(ProjectMetaConfig $config, string $since, string $until): array
    {
        return $this->paged($config, '/insights', [
            'level' => 'account',
            'time_range' => $this->range($since, $until),
            'fields' => 'spend,impressions,reach,clicks,inline_link_clicks',
        ])[0] ?? [];
    }

    /**
     * Whole-period rows split by a breakdown, for example "publisher_platform" or "age".
     *
     * @return list<array<string, mixed>>
     *
     * @throws MetaApiException
     */
    public function breakdown(ProjectMetaConfig $config, string $since, string $until, string $breakdowns): array
    {
        return $this->paged($config, '/insights', [
            'level' => 'account',
            'time_range' => $this->range($since, $until),
            'breakdowns' => $breakdowns,
            'fields' => self::METRIC_FIELDS,
            'limit' => 500,
        ]);
    }

    /**
     * Campaigns with their insights for the range.
     *
     * @return list<array<string, mixed>>
     *
     * @throws MetaApiException
     */
    public function campaigns(ProjectMetaConfig $config, string $since, string $until): array
    {
        $insights = 'insights.time_range('.$this->range($since, $until).'){'.self::METRIC_FIELDS.'}';

        return $this->paged($config, '/campaigns', [
            'fields' => 'id,name,effective_status,objective,daily_budget,'.$insights,
            'limit' => 100,
        ]);
    }

    /**
     * Ads with the creative type and insights for the range.
     *
     * @return list<array<string, mixed>>
     *
     * @throws MetaApiException
     */
    public function ads(ProjectMetaConfig $config, string $since, string $until): array
    {
        $insights = 'insights.time_range('.$this->range($since, $until).'){'.self::METRIC_FIELDS.'}';

        return $this->paged($config, '/ads', [
            'fields' => 'id,creative{object_type,video_id,object_story_spec},'.$insights,
            'limit' => 100,
        ]);
    }

    /**
     * Pixel details and event counts. Never throws: a pixel problem must not take the whole report down.
     *
     * @return array{name: ?string, lastFiredTime: ?string, isUnavailable: bool, events: array<string, int>, methods: array<string, int>}|null
     */
    public function pixel(ProjectMetaConfig $config, string $since, string $until): ?array
    {
        if (blank($config->pixel_id)) {
            return null;
        }

        $pixelId = trim((string) $config->pixel_id);
        $from = strtotime($since.' 00:00:00') ?: null;
        $to = strtotime($until.' 23:59:59') ?: null;

        try {
            $info = $this->get("/{$pixelId}", $config, ['fields' => 'name,last_fired_time,is_unavailable']);
        } catch (MetaApiException $e) {
            if ($e->isAuthError()) {
                throw $e;
            }

            return null;
        }

        return [
            'name' => $info['name'] ?? null,
            'lastFiredTime' => $info['last_fired_time'] ?? null,
            'isUnavailable' => (bool) ($info['is_unavailable'] ?? false),
            'events' => $this->pixelCounts($config, $pixelId, 'event', $from, $to),
            'methods' => $this->pixelCounts($config, $pixelId, 'event_detection_method', $from, $to),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function pixelCounts(ProjectMetaConfig $config, string $pixelId, string $aggregation, ?int $from, ?int $to): array
    {
        try {
            $buckets = $this->paged($config, '/stats', [
                'aggregation' => $aggregation,
                'start_time' => $from,
                'end_time' => $to,
            ], "/{$pixelId}");
        } catch (MetaApiException $e) {
            if ($e->isAuthError()) {
                throw $e;
            }

            return [];
        }

        $counts = [];
        foreach ($buckets as $bucket) {
            foreach ($bucket['data'] ?? [] as $entry) {
                $name = (string) ($entry['value'] ?? '');
                if ($name !== '') {
                    $counts[$name] = ($counts[$name] ?? 0) + (int) ($entry['count'] ?? 0);
                }
            }
        }

        arsort($counts);

        return $counts;
    }

    private function range(string $since, string $until): string
    {
        return json_encode(['since' => $since, 'until' => $until], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    /**
     * Read every page of an edge on the ad account (or on $base), following the cursor links.
     *
     * @param  array<string, mixed>  $params
     * @return list<array<string, mixed>>
     *
     * @throws MetaApiException
     */
    private function paged(ProjectMetaConfig $config, string $edge, array $params, ?string $base = null): array
    {
        $base ??= '/'.MetaClientService::formatAdAccountId((string) $config->ad_account_id);

        $json = $this->get($base.$edge, $config, $params);
        $rows = $json['data'] ?? [];

        for ($page = 1; $page < self::MAX_PAGES && ! empty($json['paging']['next']); $page++) {
            $json = $this->decode($this->send(fn () => Http::timeout(self::TIMEOUT_SECONDS)->get($json['paging']['next'])));
            array_push($rows, ...($json['data'] ?? []));
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<string, mixed>
     *
     * @throws MetaApiException
     */
    private function get(string $path, ProjectMetaConfig $config, array $params): array
    {
        $params = array_filter($params, fn ($value) => $value !== null);
        $params['access_token'] = $config->access_token;

        return $this->decode($this->send(fn () => Http::timeout(self::TIMEOUT_SECONDS)->get(MetaClientService::BASE_URL.$path, $params)));
    }

    /**
     * @param  callable(): Response  $request
     *
     * @throws MetaApiException
     */
    private function send(callable $request): Response
    {
        try {
            return $request();
        } catch (ConnectionException $e) {
            throw MetaApiException::connection($e->getMessage());
        }
    }

    /**
     * @return array<string, mixed>
     *
     * @throws MetaApiException
     */
    private function decode(Response $response): array
    {
        $json = $response->json();

        if (! is_array($json)) {
            throw new MetaApiException('Respons Meta tidak valid (HTTP '.$response->status().').');
        }

        if (isset($json['error']) || $response->failed()) {
            throw MetaApiException::fromResponse($json, $response->status());
        }

        return $json;
    }
}
