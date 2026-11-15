<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Freelancer;
use App\Services\ClientPortal\ClientScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class FreelancerController extends Controller
{
    private const ACTIVE_STATUSES = ['assigned', 'in_progress', 'submitted', 'revision'];

    public function index(Request $request): InertiaResponse
    {
        $scope = ClientScope::for($request);
        $ids = $scope->projectIds();

        // Counts are limited to this member's projects so a freelancer's work
        // for other clients never leaks into the statistics.
        $inScope = fn (Builder $query): Builder => $query->whereIn('project_id', $ids);

        $freelancers = Freelancer::query()
            ->where('status', 'active')
            ->whereHas('assignments', $inScope)
            ->withCount([
                'assignments as total_count' => $inScope,
                'assignments as completed_count' => fn (Builder $query) => $inScope($query)->where('status', 'completed'),
                'assignments as active_count' => fn (Builder $query) => $inScope($query)->whereIn('status', self::ACTIVE_STATUSES),
            ])
            ->orderBy('name')
            ->get();

        // Explicit DTO: never serialise the model, it appends portal_url (access token).
        $freelancerList = [];
        foreach ($freelancers as $freelancer) {
            $name = trim((string) $freelancer->name);
            $initials = collect(preg_split('/\s+/', $name, -1, PREG_SPLIT_NO_EMPTY) ?: [])
                ->take(2)
                ->map(fn (string $word): string => Str::upper(Str::substr($word, 0, 1)))
                ->implode('');

            $freelancerList[] = [
                'id' => $freelancer->id,
                'name' => $freelancer->name,
                'initials' => $initials,
                'skill' => $freelancer->role,
                'portfolio_link' => $freelancer->portfolio_link,
                'stats' => [
                    'completed' => (int) $freelancer->getAttribute('completed_count'),
                    'active' => (int) $freelancer->getAttribute('active_count'),
                    'total' => (int) $freelancer->getAttribute('total_count'),
                ],
            ];
        }

        $projectList = [];
        foreach ($scope->projects() as $project) {
            $projectList[] = [
                'id' => $project->id,
                'name' => $project->name,
            ];
        }

        return Inertia::render('client/freelancers', [
            'freelancers' => $freelancerList,
            'projects' => $projectList,
            'selectedProjectId' => $scope->selectedProjectId(),
        ]);
    }
}
