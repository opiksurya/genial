<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Services\ClientPortal\ClientPerformanceSummary;
use App\Services\ClientPortal\ClientScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, ClientPerformanceSummary $performance): Response
    {
        $scope = ClientScope::for($request);
        $projects = $scope->projects();
        $selectedId = $scope->selectedProjectId();

        $performanceProject = $selectedId !== null
            ? $projects->firstWhere('id', $selectedId)
            : $projects->first();

        $meetings = Meeting::query()
            ->whereIn('project_id', $scope->projectIds())
            ->where('start_time', '>=', now())
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_time')
            ->limit(5)
            ->get();

        $upcomingMeetings = [];
        foreach ($meetings as $meeting) {
            $upcomingMeetings[] = [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'start_time' => $meeting->start_time->toIso8601String(),
                'end_time' => $meeting->end_time->toIso8601String(),
                'platform' => $meeting->platform,
                'meeting_link' => $meeting->meeting_link,
                'project_name' => $projects->firstWhere('id', $meeting->project_id)?->name,
            ];
        }

        $projectList = [];
        foreach ($projects as $project) {
            $projectList[] = [
                'id' => $project->id,
                'name' => $project->name,
                'client' => $project->client,
                'status' => $project->status,
                'progress' => (int) $project->progress,
            ];
        }

        return Inertia::render('client/dashboard', [
            'projects' => $projectList,
            'selectedProjectId' => $selectedId,
            'upcomingMeetings' => $upcomingMeetings,
            'performance' => $performanceProject ? $performance->forProject($performanceProject) : null,
        ]);
    }
}
