<?php

namespace App\Http\Controllers;

use App\Services\ShopeeAnalytics\ShopeeAnalyticsSource;
use App\Services\ShopeeAnalytics\ShopeePeriod;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopeeAnalyticsController extends Controller
{
    public function __construct(
        protected ShopeeAnalyticsSource $analytics
    ) {}

    /**
     * Display the Shopee store analytics dashboard.
     *
     * The period is whitelisted (7/30/90 days); any other value falls back to the default period.
     */
    public function index(Request $request): Response
    {
        $period = ShopeePeriod::fromInput($request->query('period'));

        return Inertia::render('shopee/index', [
            'period' => $period->value,
            'periodOptions' => ShopeePeriod::options(),
            'analytics' => $this->analytics->report($period, CarbonImmutable::yesterday()),
        ]);
    }
}
