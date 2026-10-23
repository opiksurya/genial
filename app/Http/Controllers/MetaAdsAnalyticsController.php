<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\MetaAdsAnalytics\MetaAdsAnalyticsSource;
use App\Services\MetaAdsAnalytics\MetaAdsPeriod;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MetaAdsAnalyticsController extends Controller
{
    public function __construct(
        protected MetaAdsAnalyticsSource $analytics
    ) {}

    /**
     * Display the Meta Ads Analytics dashboard.
     */
    public function index(Request $request): Response
    {
        $period = MetaAdsPeriod::fromInput($request->query('period'));

        $projects = Project::select('id', 'name', 'client', 'slug')
            ->with('metaConfig')
            ->orderBy('name')
            ->get();

        $projectId = $request->query('project_id');
        $selectedProject = $projectId ? $projects->firstWhere('id', (int) $projectId) : null;

        if (! $selectedProject && $projects->isNotEmpty()) {
            $selectedProject = $projects->first();
        }

        return Inertia::render('meta-ads/index', [
            'period' => $period->value,
            'periodOptions' => MetaAdsPeriod::options(),
            'projects' => $projects,
            'selectedProjectId' => $selectedProject?->id,
            'selectedProject' => $selectedProject,
            'analytics' => $this->analytics->report($period, CarbonImmutable::yesterday(), $selectedProject),
        ]);
    }
}
