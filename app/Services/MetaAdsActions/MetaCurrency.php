<?php

namespace App\Services\MetaAdsActions;

/**
 * Converts between normal amounts and the minor units Meta uses for budgets.
 *
 * Meta stores campaign and ad set budgets as integers in the currency's
 * smallest unit ("offset"): USD 12.50 is sent as 1250, while currencies
 * without a fractional unit such as IDR use offset 1 (Rp150.000 is 150000).
 * Insights values such as spend are already in normal units.
 */
final class MetaCurrency
{
    /**
     * Currencies Meta treats as having no minor unit (offset 1).
     *
     * @var list<string>
     */
    public const ZERO_DECIMAL_CURRENCIES = ['CLP', 'COP', 'CRC', 'HUF', 'IDR', 'ISK', 'JPY', 'KRW', 'PYG', 'TWD', 'VND'];

    public static function offset(string $currency): int
    {
        return in_array(strtoupper(trim($currency)), self::ZERO_DECIMAL_CURRENCIES, true) ? 1 : 100;
    }

    /**
     * Parse a normal amount typed by a person (e.g. "150000" or "12.50") into Meta minor units.
     *
     * The string is parsed without floats. Thousand separators are rejected
     * because "150.000" would otherwise be read as 150 rupiah.
     *
     * @throws MetaAdsActionRejected
     */
    public static function toMinorUnits(string|int $amount, string $currency): int
    {
        $amount = trim((string) $amount);
        $offset = self::offset($currency);
        $currency = strtoupper(trim($currency));

        $pattern = $offset === 1 ? '/^\d+$/' : '/^\d+(\.\d{1,2})?$/';
        if (! preg_match($pattern, $amount)) {
            $hint = $offset === 1
                ? "{$currency} tidak punya pecahan; tulis bilangan bulat tanpa titik/koma, contoh 150000."
                : 'Tulis angka dengan titik sebagai desimal (maks. 2 angka), tanpa pemisah ribuan, contoh 12.50.';

            throw new MetaAdsActionRejected("Nominal \"{$amount}\" tidak valid. {$hint}", 'invalid_amount');
        }

        [$whole, $fraction] = array_pad(explode('.', $amount, 2), 2, '');
        $minor = (int) $whole * $offset + ($offset === 1 ? 0 : (int) str_pad($fraction, 2, '0'));

        if ($minor <= 0) {
            throw new MetaAdsActionRejected('Budget harus lebih dari 0.', 'invalid_amount');
        }

        return $minor;
    }

    /**
     * Convert a Meta minor-unit budget into a normal amount; empty budgets become null.
     */
    public static function fromMinorUnits(int|string|null $minor, string $currency): int|float|null
    {
        if ($minor === null || $minor === '' || (int) $minor === 0) {
            return null;
        }

        $offset = self::offset($currency);

        return $offset === 1 ? (int) $minor : round((int) $minor / $offset, 2);
    }
}
