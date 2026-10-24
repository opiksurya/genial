<?php

namespace App\Services\MetaAdsActions;

use App\Models\ProjectMetaConfig;

/**
 * Reads campaigns, ad sets and their insights for one project's ad account.
 */
class MetaAdsReader
{
    /**
     * Date presets accepted by the Insights API.
     *
     * @var list<string>
     */
    public const DATE_PRESETS = [
        'today', 'yesterday', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year',
        'last_3d', 'last_7d', 'last_14d', 'last_28d', 'last_30d', 'last_90d', 'maximum',
        'this_week_mon_today', 'this_week_sun_today', 'last_week_mon_sun', 'last_week_sun_sat',
    ];

    /**
     * Action types counted as the main result, by campaign objective, most specific first.
     *
     * @var array<string, list<string>>
     */
    public const RESULT_ACTION_TYPES = [
        'sales' => ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase'],
        'leads' => ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'],
        'messages' => ['onsite_conversion.messaging_conversation_started_7d'],
        'app' => ['omni_app_install', 'mobile_app_install', 'app_install'],
        'traffic' => ['landing_page_view', 'link_click'],
        'engagement' => ['post_engagement'],
    ];

    /**
     * Result groups to try for each objective.
     *
     * @var array<string, list<string>>
     */
    private const OBJECTIVE_RESULT_GROUPS = [
        'OUTCOME_SALES' => ['sales'],
        'CONVERSIONS' => ['sales', 'leads'],
        'PRODUCT_CATALOG_SALES' => ['sales'],
        'OUTCOME_LEADS' => ['leads', 'messages'],
        'LEAD_GENERATION' => ['leads'],
        'OUTCOME_ENGAGEMENT' => ['messages', 'engagement'],
        'MESSAGES' => ['messages'],
        'POST_ENGAGEMENT' => ['engagement'],
        'OUTCOME_TRAFFIC' => ['traffic'],
        'LINK_CLICKS' => ['traffic'],
        'OUTCOME_APP_PROMOTION' => ['app'],
        'APP_INSTALLS' => ['app'],
        'OUTCOME_AWARENESS' => [],
        'BRAND_AWARENESS' => [],
        'REACH' => [],
    ];

    private const INSIGHT_FIELDS = 'spend,impressions,clicks,ctr,actions,cost_per_action_type,purchase_roas';

    public function __construct(
        private readonly ProjectMetaConfig $config,
        private readonly MetaGraphClient $client,
    ) {}

    public static function for(ProjectMetaConfig $config): self
    {
        return new self($config, new MetaGraphClient($config));
    }

    /**
     * List campaigns (and optionally their ad sets) with budgets and insights.
     *
     * @return list<array<string, mixed>>
     *
     * @throws MetaApiException
     * @throws MetaAdsActionRejected
     */
    public function campaigns(string $datePreset = 'last_7d', bool $withAdsets = false): array
    {
        if (! in_array($datePreset, self::DATE_PRESETS, true)) {
            throw new MetaAdsActionRejected('Date preset tidak dikenal. Pilihan: '.implode(', ', self::DATE_PRESETS).'.', 'invalid');
        }

        $account = $this->config->formatted_ad_account_id;
        $insights = "insights.date_preset({$datePreset}){".self::INSIGHT_FIELDS.'}';

        $rawCampaigns = $this->client->getAll("{$account}/campaigns", [
            'fields' => "id,name,status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining,{$insights}",
            'limit' => 100,
        ]);

        $adsetsByCampaign = [];
        if ($withAdsets) {
            $rawAdsets = $this->client->getAll("{$account}/adsets", [
                'fields' => "id,name,campaign_id,status,effective_status,optimization_goal,daily_budget,lifetime_budget,budget_remaining,{$insights}",
                'limit' => 100,
            ]);

            foreach ($rawAdsets as $adset) {
                $adsetsByCampaign[$adset['campaign_id'] ?? ''][] = $adset;
            }
        }

        return array_map(function (array $campaign) use ($withAdsets, $adsetsByCampaign): array {
            $objective = $campaign['objective'] ?? null;
            $isCampaignBudget = $this->hasBudget($campaign);

            $row = [
                'id' => (string) $campaign['id'],
                'name' => $campaign['name'] ?? null,
                'status' => $campaign['status'] ?? null,
                'effective_status' => $campaign['effective_status'] ?? null,
                'objective' => $objective,
                'budget_level' => $isCampaignBudget ? 'campaign' : 'adset',
                'cbo' => $isCampaignBudget,
                ...$this->budgets($campaign),
                'insights' => $this->summarizeInsights($campaign['insights']['data'][0] ?? null, $objective),
            ];

            if ($withAdsets) {
                $row['adsets'] = array_map(fn (array $adset): array => [
                    'id' => (string) $adset['id'],
                    'name' => $adset['name'] ?? null,
                    'status' => $adset['status'] ?? null,
                    'effective_status' => $adset['effective_status'] ?? null,
                    'optimization_goal' => $adset['optimization_goal'] ?? null,
                    'budget_level' => $isCampaignBudget ? 'campaign' : 'adset',
                    ...$this->budgets($adset),
                    'insights' => $this->summarizeInsights($adset['insights']['data'][0] ?? null, $objective),
                ], $adsetsByCampaign[(string) $campaign['id']] ?? []);
            }

            return $row;
        }, $rawCampaigns);
    }

    /**
     * @param  array<string, mixed>  $object
     */
    public function hasBudget(array $object): bool
    {
        return MetaCurrency::fromMinorUnits($object['daily_budget'] ?? null, $this->currency()) !== null
            || MetaCurrency::fromMinorUnits($object['lifetime_budget'] ?? null, $this->currency()) !== null;
    }

    /**
     * @param  array<string, mixed>  $object
     * @return array{daily_budget: int|float|null, lifetime_budget: int|float|null, budget_remaining: int|float|null}
     */
    public function budgets(array $object): array
    {
        return [
            'daily_budget' => MetaCurrency::fromMinorUnits($object['daily_budget'] ?? null, $this->currency()),
            'lifetime_budget' => MetaCurrency::fromMinorUnits($object['lifetime_budget'] ?? null, $this->currency()),
            'budget_remaining' => MetaCurrency::fromMinorUnits($object['budget_remaining'] ?? null, $this->currency()),
        ];
    }

    public function currency(): string
    {
        return $this->config->currency ?: 'IDR';
    }

    /**
     * Reduce a raw insights row to the numbers the bot reports.
     *
     * @param  array<string, mixed>|null  $insight
     * @return array{spend: float, impressions: int, clicks: int, ctr: float, result: array{type: string, value: int}|null, cpa: float|null, roas: float|null}
     */
    public function summarizeInsights(?array $insight, ?string $objective): array
    {
        $spend = (float) ($insight['spend'] ?? 0);
        $result = $this->mainResult($insight['actions'] ?? [], $objective);

        $roas = null;
        foreach ($insight['purchase_roas'] ?? [] as $entry) {
            $roas = round((float) ($entry['value'] ?? 0), 2);
            break;
        }

        return [
            'spend' => $spend,
            'impressions' => (int) ($insight['impressions'] ?? 0),
            'clicks' => (int) ($insight['clicks'] ?? 0),
            'ctr' => round((float) ($insight['ctr'] ?? 0), 2),
            'result' => $result,
            'cpa' => $result !== null && $result['value'] > 0 ? round($spend / $result['value'], 2) : null,
            'roas' => $roas,
        ];
    }

    /**
     * Pick the single action that best represents the objective. Overlapping
     * types (e.g. purchase and omni_purchase) are never summed.
     *
     * @param  list<array{action_type?: string, value?: string|int}>  $actions
     * @return array{type: string, value: int}|null
     */
    private function mainResult(array $actions, ?string $objective): ?array
    {
        $groups = self::OBJECTIVE_RESULT_GROUPS[$objective ?? ''] ?? array_keys(self::RESULT_ACTION_TYPES);

        $values = [];
        foreach ($actions as $action) {
            $values[$action['action_type'] ?? ''] = (int) ($action['value'] ?? 0);
        }

        foreach ($groups as $group) {
            foreach (self::RESULT_ACTION_TYPES[$group] as $type) {
                if (($values[$type] ?? 0) > 0) {
                    return ['type' => $type, 'value' => $values[$type]];
                }
            }
        }

        return null;
    }
}
