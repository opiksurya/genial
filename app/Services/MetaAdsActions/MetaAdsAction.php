<?php

namespace App\Services\MetaAdsActions;

/**
 * A validated request to change one campaign or ad set.
 */
final readonly class MetaAdsAction
{
    public const SET_STATUS = 'set_status';

    public const SET_BUDGET = 'set_budget';

    public const DUPLICATE_CAMPAIGN = 'duplicate_campaign';

    /**
     * @var list<string>
     */
    public const ACTIONS = [self::SET_STATUS, self::SET_BUDGET, self::DUPLICATE_CAMPAIGN];

    /**
     * @var list<string>
     */
    public const OBJECT_TYPES = ['campaign', 'adset'];

    /**
     * @var list<string>
     */
    public const STATUSES = ['ACTIVE', 'PAUSED'];

    /**
     * @var list<string>
     */
    public const BUDGET_TYPES = ['daily', 'lifetime'];

    private function __construct(
        public string $action,
        public string $objectType,
        public string $objectId,
        public ?string $status = null,
        public ?string $budgetType = null,
        public ?string $amount = null,
        public ?string $name = null,
    ) {}

    /**
     * Build an action from raw command input, rejecting incomplete or unknown values.
     *
     * @throws MetaAdsActionRejected
     */
    public static function fromInput(
        ?string $action,
        ?string $objectType,
        ?string $objectId,
        ?string $status = null,
        ?string $budgetType = null,
        ?string $amount = null,
        ?string $name = null,
    ): self {
        if (! in_array($action, self::ACTIONS, true)) {
            throw new MetaAdsActionRejected('Aksi harus salah satu dari: '.implode(', ', self::ACTIONS).'.');
        }

        if (! in_array($objectType, self::OBJECT_TYPES, true)) {
            throw new MetaAdsActionRejected('Opsi --object-type harus campaign atau adset.');
        }

        $objectId = trim((string) $objectId);
        if (! preg_match('/^\d+$/', $objectId)) {
            throw new MetaAdsActionRejected('Opsi --object-id wajib diisi dengan ID angka dari Meta.');
        }

        $status = $status !== null ? strtoupper(trim($status)) : null;
        $name = $name !== null && trim($name) !== '' ? trim($name) : null;

        if ($action === self::SET_STATUS && ! in_array($status, self::STATUSES, true)) {
            throw new MetaAdsActionRejected('Opsi --status harus ACTIVE atau PAUSED.');
        }

        if ($action === self::SET_BUDGET) {
            if (! in_array($budgetType, self::BUDGET_TYPES, true)) {
                throw new MetaAdsActionRejected('Opsi --budget-type harus daily atau lifetime.');
            }

            if ($amount === null || trim($amount) === '') {
                throw new MetaAdsActionRejected('Opsi --amount=<nominal> wajib diisi.', 'invalid_amount');
            }
        }

        if ($action === self::DUPLICATE_CAMPAIGN && $objectType !== 'campaign') {
            throw new MetaAdsActionRejected('duplicate_campaign hanya untuk --object-type=campaign.');
        }

        return new self(
            $action,
            $objectType,
            $objectId,
            $action === self::SET_STATUS ? $status : null,
            $action === self::SET_BUDGET ? $budgetType : null,
            $action === self::SET_BUDGET ? trim((string) $amount) : null,
            $action === self::DUPLICATE_CAMPAIGN ? $name : null,
        );
    }
}
