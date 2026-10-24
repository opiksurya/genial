<?php

namespace App\Http\Controllers;

use App\Models\Project;
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

        $projects = Project::select('id', 'name', 'client', 'slug')
            ->with(['shopeeConfig' => function ($query) {
                $query->select('id', 'project_id', 'partner_id', 'is_sandbox', 'shop_id', 'shop_name', 'status', 'token_expires_at', 'last_synced_at', 'error_message');
            }])
            ->orderBy('name')
            ->get();

        $projectId = $request->query('project_id');
        $selectedProject = $projectId ? $projects->firstWhere('id', (int) $projectId) : null;

        if (! $selectedProject && $projects->isNotEmpty()) {
            $selectedProject = $projects->first();
        }

        return Inertia::render('shopee/index', [
            'period' => $period->value,
            'periodOptions' => ShopeePeriod::options(),
            'projects' => $projects,
            'selectedProjectId' => $selectedProject?->id,
            'selectedProject' => $selectedProject,
            'analytics' => $this->analytics->report($period, CarbonImmutable::yesterday(), $selectedProject),
        ]);
    }
}
