<?php

namespace App\Services\MetaAdsAnalytics;

enum MetaAdsPeriod: int
{
    case Last7Days = 7;
    case Last30Days = 30;
    case Last90Days = 90;

    /**
     * Resolve a period from untrusted input, falling back to the default period.
     */
    public static function fromInput(mixed $value): self
    {
        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            return self::tryFrom((int) $value) ?? self::default();
        }

        return self::default();
    }

    public static function default(): self
    {
        return self::Last30Days;
    }

    public function label(): string
    {
        return "{$this->value} Hari Terakhir";
    }

    /**
     * @return list<array{value: int, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $period): array => ['value' => $period->value, 'label' => $period->label()],
            self::cases(),
        );
    }
}
