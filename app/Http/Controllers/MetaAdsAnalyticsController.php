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

        $projects = Project::visibleTo($request->user())
            ->select('id', 'name', 'client', 'slug')
            ->with(['metaConfig', 'metaConfigs'])
            ->orderBy('name')
            ->get();

        $projectId = $request->query('project_id');
        $selectedProject = $projectId ? $projects->firstWhere('id', (int) $projectId) : null;

        if (! $selectedProject && $projects->isNotEmpty()) {
            $selectedProject = $projects->first();
        }

        // Let the viewer pick one of the project's ad accounts; fall back to the default one.
        $adAccounts = $selectedProject?->metaConfigs ?? collect();
        $selectedAccount = $adAccounts->firstWhere('ad_account_id', $request->query('ad_account_id'))
            ?? $selectedProject?->metaConfig;
        if ($selectedProject && $selectedAccount) {
            $selectedProject->setRelation('metaConfig', $selectedAccount);
        }

        return Inertia::render('meta-ads/index', [
            'period' => $period->value,
            'periodOptions' => MetaAdsPeriod::options(),
            'projects' => $projects,
            'selectedProjectId' => $selectedProject?->id,
            'selectedProject' => $selectedProject,
            'adAccounts' => $adAccounts->map(fn ($c) => [
                'id' => $c->id,
                'ad_account_id' => $c->ad_account_id,
                'account_name' => $c->account_name,
                'is_default' => (bool) $c->is_default,
                'status' => $c->status,
            ])->values(),
            'metaApp' => [
                'configured' => \App\Services\MetaAppCredentials::isConfigured(),
                'app_id' => \App\Services\MetaAppCredentials::appId(),
                'redirect_uri' => route('meta-ads.callback'),
                'can_setup' => (bool) $request->user()?->hasRole('Super Admin'),
            ],
            'selectedAdAccountId' => $selectedAccount?->ad_account_id,
            'analytics' => $this->analytics->report($period, CarbonImmutable::yesterday(), $selectedProject),
        ]);
    }
}
