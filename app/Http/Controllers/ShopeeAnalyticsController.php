<?php

namespace App\Http\Controllers;

use App\Services\ShopeeAnalytics\ShopeeDummyDataService;
use App\Services\ShopeeAnalytics\ShopeePeriod;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopeeAnalyticsController extends Controller
{
    public function __construct(
        protected ShopeeDummyDataService $shopeeData
    ) {}

    /**
     * Display the Shopee store analytics for the selected period (dummy data).
     */
    public function index(Request $request): Response
    {
        $period = ShopeePeriod::fromQuery($request->query('period'));

        return Inertia::render('shopee/index', [
            'period' => $period->value,
            'periodOptions' => ShopeePeriod::options(),
            'report' => $this->shopeeData->report($period, CarbonImmutable::yesterday()),
        ]);
    }
}
