<?php

use App\Services\MetaAdsActions\MetaAdsActionRejected;
use App\Services\MetaAdsActions\MetaCurrency;

test('idr budgets have no minor unit', function () {
    expect(MetaCurrency::offset('IDR'))->toBe(1)
        ->and(MetaCurrency::toMinorUnits('150000', 'IDR'))->toBe(150000)
        ->and(MetaCurrency::fromMinorUnits('150000', 'IDR'))->toBe(150000);
});

test('usd budgets are sent in cents', function (string $amount, int $cents) {
    expect(MetaCurrency::toMinorUnits($amount, 'USD'))->toBe($cents);
})->with([
    'whole dollars' => ['12', 1200],
    'one decimal' => ['12.5', 1250],
    'two decimals' => ['12.55', 1255],
]);

test('usd minor units convert back to dollars', function () {
    expect(MetaCurrency::offset('usd'))->toBe(100)
        ->and(MetaCurrency::fromMinorUnits('1255', 'USD'))->toBe(12.55)
        ->and(MetaCurrency::fromMinorUnits(1200, 'USD'))->toEqual(12.0);
});

test('empty or zero budgets read as null', function (mixed $minor) {
    expect(MetaCurrency::fromMinorUnits($minor, 'IDR'))->toBeNull();
})->with([null, '', '0', 0]);

test('ambiguous or non positive amounts are rejected', function (string $amount, string $currency) {
    expect(fn () => MetaCurrency::toMinorUnits($amount, $currency))
        ->toThrow(MetaAdsActionRejected::class);
})->with([
    'idr thousand separator' => ['150.000', 'IDR'],
    'idr comma' => ['150,000', 'IDR'],
    'idr fraction' => ['1500.5', 'IDR'],
    'usd three decimals' => ['12.555', 'USD'],
    'usd comma' => ['1,200', 'USD'],
    'zero' => ['0', 'IDR'],
    'zero cents' => ['0.00', 'USD'],
    'negative' => ['-5000', 'IDR'],
    'text' => ['banyak', 'USD'],
]);
