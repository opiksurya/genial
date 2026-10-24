<?php

namespace App\Services\MetaAdsActions;

use App\Models\ProjectMetaConfig;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Validates, previews and executes Meta Ads changes requested via the Telegram bot.
 *
 * Every change is checked against the project's ad account first, then the
 * object is read before and after the write so the caller can show both.
 */
class MetaAdsActionService
{
    private const CAMPAIGN_FIELDS = 'id,name,account_id,status,effective_status,objective,daily_budget,lifetime_budget,budget_remaining';

    private const ADSET_FIELDS = 'id,name,account_id,campaign_id,status,effective_status,daily_budget,lifetime_budget,budget_remaining,campaign{id,name,daily_budget,lifetime_budget}';

    public function __construct(
        private readonly ProjectMetaConfig $config,
        private readonly MetaGraphClient $client,
        private readonly MetaAdsReader $reader,
    ) {}

    public static function for(ProjectMetaConfig $config): self
    {
        $client = new MetaGraphClient($config);

        return new self($config, $client, new MetaAdsReader($config, $client));
    }

    /**
     * Validate the action and describe the expected result without writing anything.
     *
     * @return array{action: string, object: array<string, mixed>, before: array<string, mixed>, after: array<string, mixed>, change: array<string, mixed>, executed: false}
     *
     * @throws MetaAdsActionRejected
     * @throws MetaApiException
     */
    public function preview(MetaAdsAction $action): array
    {
        $plan = $this->plan($action);

        return [
            'action' => $action->action,
            'object' => $this->objectSummary($plan['before']),
            'before' => $plan['before'],
            'after' => $plan['after'],
            'change' => $plan['change'],
            'executed' => false,
        ];
    }

    /**
     * Validate, apply the change at Meta and return the state before and after.
     *
     * @return array{action: string, object: array<string, mixed>, before: array<string, mixed>, after: array<string, mixed>, change: array<string, mixed>, executed: true, warnings: list<string>}
     *
     * @throws MetaAdsActionRejected
     * @throws MetaApiException
     */
    public function execute(MetaAdsAction $action, User $user): array
    {
        $plan = $this->plan($action);
        $before = $plan['before'];
        $warnings = [];

        try {
            if ($action->action === MetaAdsAction::DUPLICATE_CAMPAIGN) {
                $copy = $this->client->post("{$action->objectId}/copies", [
                    'deep_copy' => 'true',
                    'status_option' => 'PAUSED',
                ]);

                $newId = (string) ($copy['copied_campaign_id'] ?? '');
                if ($newId === '') {
                    throw new MetaApiException('Meta tidak mengembalikan ID campaign hasil duplikat.');
                }

                try {
                    $this->client->post($newId, ['name' => $plan['after']['name']]);
                } catch (MetaApiException $exception) {
                    $warnings[] = 'Campaign sudah diduplikat tetapi gagal diberi nama baru: '.$exception->getMessage();
                }

                $after = $this->snapshot('campaign', $newId);
            } else {
                $this->client->post($action->objectId, $plan['request']);
                $after = $this->snapshot($action->objectType, $action->objectId);
            }
        } catch (MetaApiException $exception) {
            Log::warning('Ads bot action failed', [
                ...$this->logContext($action, $user),
                'before' => $before,
                'error' => $exception->getMessage(),
                ...$exception->details(),
            ]);

            throw $exception;
        }

        Log::info('Ads bot action executed', [
            ...$this->logContext($action, $user),
            'before' => $before,
            'after' => $after,
            'warnings' => $warnings,
        ]);

        return [
            'action' => $action->action,
            'object' => $this->objectSummary($before),
            'before' => $before,
            'after' => $after,
            'change' => $plan['change'],
            'executed' => true,
            'warnings' => $warnings,
        ];
    }

    /**
     * Read a campaign or ad set and make sure it belongs to this project's ad account.
     *
     * @return array<string, mixed>
     *
     * @throws MetaAdsActionRejected
     * @throws MetaApiException
     */
    public function snapshot(string $objectType, string $objectId): array
    {
        $raw = $this->client->get($objectId, [
            'fields' => $objectType === 'campaign' ? self::CAMPAIGN_FIELDS : self::ADSET_FIELDS,
        ]);

        $owner = self::normalizeAccountId((string) ($raw['account_id'] ?? ''));
        if ($owner === '' || $owner !== self::normalizeAccountId((string) $this->config->ad_account_id)) {
            throw new MetaAdsActionRejected(
                "Objek {$objectType} {$objectId} bukan milik akun iklan project ini ({$this->config->formatted_ad_account_id}).",
                'not_owned',
            );
        }

        $snapshot = [
            'type' => $objectType,
            'id' => (string) $raw['id'],
            'name' => $raw['name'] ?? null,
            'status' => $raw['status'] ?? null,
            'effective_status' => $raw['effective_status'] ?? null,
        ];

        if ($objectType === 'campaign') {
            $snapshot['objective'] = $raw['objective'] ?? null;
            $snapshot['budget_level'] = $this->reader->hasBudget($raw) ? 'campaign' : 'adset';
        } else {
            $snapshot['campaign_id'] = isset($raw['campaign_id']) ? (string) $raw['campaign_id'] : null;
            $snapshot['campaign_name'] = $raw['campaign']['name'] ?? null;
            $snapshot['budget_level'] = $this->reader->hasBudget($raw['campaign'] ?? []) ? 'campaign' : 'adset';
        }

        return [
            ...$snapshot,
            ...$this->reader->budgets($raw),
            'currency' => $this->reader->currency(),
        ];
    }

    public static function normalizeAccountId(string $accountId): string
    {
        $accountId = trim($accountId);

        return str_starts_with($accountId, 'act_') ? substr($accountId, 4) : $accountId;
    }

    /**
     * @return array{before: array<string, mixed>, after: array<string, mixed>, change: array<string, mixed>, request: array<string, mixed>}
     *
     * @throws MetaAdsActionRejected
     * @throws MetaApiException
     */
    private function plan(MetaAdsAction $action): array
    {
        $before = $this->snapshot($action->objectType, $action->objectId);

        return match ($action->action) {
            MetaAdsAction::SET_STATUS => $this->planStatus($action, $before),
            MetaAdsAction::SET_BUDGET => $this->planBudget($action, $before),
            MetaAdsAction::DUPLICATE_CAMPAIGN => $this->planDuplicate($action, $before),
        };
    }

    /**
     * @param  array<string, mixed>  $before
     * @return array{before: array<string, mixed>, after: array<string, mixed>, change: array<string, mixed>, request: array<string, mixed>}
     */
    private function planStatus(MetaAdsAction $action, array $before): array
    {
        if ($before['status'] === $action->status) {
            throw new MetaAdsActionRejected("Status {$action->objectType} ini sudah {$action->status}.", 'no_change');
        }

        return [
            'before' => $before,
            'after' => [...$before, 'status' => $action->status, 'effective_status' => null],
            'change' => ['field' => 'status', 'from' => $before['status'], 'to' => $action->status],
            'request' => ['status' => $action->status],
        ];
    }

    /**
     * @param  array<string, mixed>  $before
     * @return array{before: array<string, mixed>, after: array<string, mixed>, change: array<string, mixed>, request: array<string, mixed>}
     */
    private function planBudget(MetaAdsAction $action, array $before): array
    {
        if ($action->objectType === 'campaign' && $before['budget_level'] === 'adset') {
            throw new MetaAdsActionRejected(
                'Campaign ini tidak memakai budget campaign (CBO); budget diatur di tiap ad set. Ubah budget ad set-nya.',
                'wrong_budget_level',
            );
        }

        if ($action->objectType === 'adset' && $before['budget_level'] === 'campaign') {
            throw new MetaAdsActionRejected(
                "Ad set ini ada di campaign yang memakai CBO; budget diatur di level campaign {$before['campaign_id']}.",
                'wrong_budget_level',
            );
        }

        $currentType = $before['daily_budget'] !== null ? 'daily' : 'lifetime';
        if ($action->budgetType !== $currentType) {
            throw new MetaAdsActionRejected(
                "Budget {$action->objectType} ini bertipe {$currentType}; Meta tidak mengizinkan mengganti daily dan lifetime.",
                'budget_type_mismatch',
            );
        }

        $field = "{$action->budgetType}_budget";
        $minor = MetaCurrency::toMinorUnits($action->amount, $before['currency']);
        $amount = MetaCurrency::fromMinorUnits($minor, $before['currency']);
        $current = $before[$field];

        if ($current == $amount) {
            throw new MetaAdsActionRejected("Budget {$action->budgetType} sudah {$amount} {$before['currency']}.", 'no_change');
        }

        return [
            'before' => $before,
            'after' => [...$before, $field => $amount, 'budget_remaining' => null],
            'change' => [
                'field' => $field,
                'from' => $current,
                'to' => $amount,
                'percent' => $current ? round(($amount - $current) / $current * 100, 1) : null,
                'currency' => $before['currency'],
            ],
            'request' => [$field => $minor],
        ];
    }

    /**
     * @param  array<string, mixed>  $before
     * @return array{before: array<string, mixed>, after: array<string, mixed>, change: array<string, mixed>, request: array<string, mixed>}
     */
    private function planDuplicate(MetaAdsAction $action, array $before): array
    {
        $name = $action->name ?? trim(($before['name'] ?? 'Campaign').' - Copy');

        return [
            'before' => $before,
            'after' => [
                ...$before,
                'id' => null,
                'name' => $name,
                'status' => 'PAUSED',
                'effective_status' => 'PAUSED',
                'budget_remaining' => null,
            ],
            'change' => ['field' => 'copy', 'deep_copy' => true, 'status' => 'PAUSED', 'name' => $name],
            'request' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{type: string, id: string, name: string|null}
     */
    private function objectSummary(array $snapshot): array
    {
        return ['type' => $snapshot['type'], 'id' => $snapshot['id'], 'name' => $snapshot['name']];
    }

    /**
     * @return array<string, mixed>
     */
    private function logContext(MetaAdsAction $action, User $user): array
    {
        return [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'project_id' => $this->config->project_id,
            'ad_account_id' => $this->config->ad_account_id,
            'action' => $action->action,
            'object_type' => $action->objectType,
            'object_id' => $action->objectId,
        ];
    }
}
