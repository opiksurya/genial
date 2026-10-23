<?php

namespace App\Services\ShopeeAnalytics;

enum ShopeePeriod: int
{
    case Last7Days = 7;
    case Last30Days = 30;
    case Last90Days = 90;

    /**
     * Resolve the period from a query string value, falling back to the default for anything invalid.
     */
    public static function fromQuery(mixed $value): self
    {
        $days = filter_var($value, FILTER_VALIDATE_INT);

        return is_int($days) ? (self::tryFrom($days) ?? self::default()) : self::default();
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
