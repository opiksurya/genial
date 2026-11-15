<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Services\ClientPortal\ClientScope;
use App\Services\MeetingIcs;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class MeetingController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $scope = ClientScope::for($request);
        $projects = $scope->projects();

        $meetings = Meeting::query()
            ->whereIn('project_id', $scope->projectIds())
            ->orderBy('start_time')
            ->get();

        $meetingList = [];
        foreach ($meetings as $meeting) {
            $meetingList[] = [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'start_time' => $meeting->start_time->toIso8601String(),
                'end_time' => $meeting->end_time->toIso8601String(),
                'platform' => $meeting->platform,
                'meeting_link' => $meeting->meeting_link,
                'location' => $meeting->location,
                'status' => $meeting->status,
                'project_name' => $projects->firstWhere('id', $meeting->project_id)?->name,
            ];
        }

        $projectList = [];
        foreach ($projects as $project) {
            $projectList[] = [
                'id' => $project->id,
                'name' => $project->name,
            ];
        }

        return Inertia::render('client/meetings', [
            'meetings' => $meetingList,
            'projects' => $projectList,
            'selectedProjectId' => $scope->selectedProjectId(),
        ]);
    }

    public function ics(Request $request, Meeting $meeting): Response
    {
        $scope = ClientScope::for($request);

        // The project filter is deliberately ignored: any project the member
        // belongs to is downloadable, anything else does not exist for them.
        if ($meeting->project_id === null || ! in_array((int) $meeting->project_id, $scope->allProjectIds(), true)) {
            abort(404);
        }

        return response(MeetingIcs::render($meeting, includeDescription: false), 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="meeting-'.$meeting->id.'.ics"',
        ]);
    }
}
