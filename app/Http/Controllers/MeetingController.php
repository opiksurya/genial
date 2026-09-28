<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class MeetingController extends Controller
{
    /**
     * Display a listing of meetings and calendar views.
     */
    public function index(Request $request)
    {
        $query = Meeting::with(['project', 'user'])->latest('start_time');

        if ($request->filled('platform') && $request->platform !== 'all') {
            $query->where('platform', $request->platform);
        }

        if ($request->filled('project_id') && $request->project_id !== 'all') {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $meetings = $query->get()->map(function ($m) {
            return [
                'id' => $m->id,
                'title' => $m->title,
                'description' => $m->description,
                'start_time' => $m->start_time ? $m->start_time->toIso8601String() : null,
                'end_time' => $m->end_time ? $m->end_time->toIso8601String() : null,
                'date' => $m->start_time ? $m->start_time->format('Y-m-d') : null,
                'start_hour' => $m->start_time ? $m->start_time->format('H:i') : null,
                'end_hour' => $m->end_time ? $m->end_time->format('H:i') : null,
                'platform' => $m->platform,
                'meeting_link' => $m->meeting_link,
                'location' => $m->location,
                'status' => $m->status,
                'attendees' => $m->attendees ?? [],
                'google_calendar_url' => $m->google_calendar_url,
                'project' => $m->project ? [
                    'id' => $m->project->id,
                    'name' => $m->project->name,
                    'client' => $m->project->client,
                ] : null,
                'user' => $m->user ? [
                    'id' => $m->user->id,
                    'name' => $m->user->name,
                    'email' => $m->user->email,
                ] : null,
            ];
        });

        $projects = Project::select('id', 'name', 'client')->latest()->get();

        $upcomingMeetings = Meeting::with(['project'])
            ->where('start_time', '>=', now())
            ->where('status', '!=', 'cancelled')
            ->orderBy('start_time', 'asc')
            ->limit(5)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'start_time' => $m->start_time->toIso8601String(),
                    'end_time' => $m->end_time->toIso8601String(),
                    'platform' => $m->platform,
                    'meeting_link' => $m->meeting_link,
                    'status' => $m->status,
                    'google_calendar_url' => $m->google_calendar_url,
                    'project_name' => $m->project ? $m->project->name : null,
                ];
            });

        return Inertia::render('meetings/index', [
            'meetings' => $meetings,
            'projects' => $projects,
            'upcomingMeetings' => $upcomingMeetings,
            'calendarFeedUrl' => url('/meetings/feed.ics'),
            'filters' => [
                'platform' => $request->platform ?? 'all',
                'project_id' => $request->project_id ?? 'all',
                'status' => $request->status ?? 'all',
            ],
        ]);
    }

    /**
     * Store a newly created meeting.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after_or_equal:start_time',
            'platform' => 'required|string|in:google_meet,zoom,offline,phone',
            'meeting_link' => 'nullable|string|max:500',
            'location' => 'nullable|string|max:255',
            'project_id' => 'nullable|exists:projects,id',
            'attendees' => 'nullable|array',
            'status' => 'nullable|string|in:scheduled,in_progress,completed,cancelled',
        ]);

        $validated['user_id'] = $request->user()?->id;
        $validated['status'] = $validated['status'] ?? 'scheduled';

        Meeting::create($validated);

        return redirect()->back()->with('success', 'Agenda meeting berhasil ditambahkan!');
    }

    /**
     * Update the specified meeting.
     */
    public function update(Request $request, Meeting $meeting)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after_or_equal:start_time',
            'platform' => 'required|string|in:google_meet,zoom,offline,phone',
            'meeting_link' => 'nullable|string|max:500',
            'location' => 'nullable|string|max:255',
            'project_id' => 'nullable|exists:projects,id',
            'attendees' => 'nullable|array',
            'status' => 'nullable|string|in:scheduled,in_progress,completed,cancelled',
        ]);

        $meeting->update($validated);

        return redirect()->back()->with('success', 'Agenda meeting berhasil diperbarui!');
    }

    /**
     * Remove the specified meeting.
     */
    public function destroy(Meeting $meeting)
    {
        $meeting->delete();

        return redirect()->back()->with('success', 'Agenda meeting berhasil dihapus!');
    }

    /**
     * Export all scheduled meetings as an iCalendar (.ics) live feed for Google Calendar / Apple Calendar subscription.
     */
    public function feed()
    {
        $meetings = Meeting::with(['project', 'user'])
            ->where('status', '!=', 'cancelled')
            ->where('start_time', '>=', now()->subMonths(2))
            ->orderBy('start_time', 'asc')
            ->get();

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Genial Digital Solution//Meeting Agendas//ID',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Genial Meeting Agendas',
            'X-WR-TIMEZONE:Asia/Jakarta',
            'X-WR-CALDESC:Jadwal Agenda Meeting & Koordinasi Genial Digital Solution',
        ];

        foreach ($meetings as $m) {
            $dtStart = $m->start_time->utc()->format('Ymd\THis\Z');
            $dtEnd = $m->end_time->utc()->format('Ymd\THis\Z');
            $dtStamp = now()->utc()->format('Ymd\THis\Z');
            $uid = 'genial-meeting-' . $m->id . '@' . parse_url(config('app.url', 'http://localhost'), PHP_URL_HOST);

            $summary = str_replace(["\r", "\n", ";", ","], ["", " ", "\\;", "\\,"], $m->title);
            $location = str_replace(["\r", "\n", ";", ","], ["", " ", "\\;", "\\,"], $m->meeting_link ?: ($m->location ?: 'Online'));
            
            $descParts = [];
            if ($m->description) {
                $descParts[] = $m->description;
            }
            if ($m->meeting_link) {
                $descParts[] = 'Link: ' . $m->meeting_link;
            }
            if ($m->project) {
                $descParts[] = 'Project: ' . $m->project->name;
            }
            $description = str_replace(["\r", "\n", ";", ","], ["", "\\n", "\\;", "\\,"], implode("\n", $descParts));

            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:' . $uid;
            $lines[] = 'DTSTAMP:' . $dtStamp;
            $lines[] = 'DTSTART:' . $dtStart;
            $lines[] = 'DTEND:' . $dtEnd;
            $lines[] = 'SUMMARY:' . $summary;
            $lines[] = 'DESCRIPTION:' . $description;
            $lines[] = 'LOCATION:' . $location;
            if ($m->meeting_link) {
                $lines[] = 'URL:' . $m->meeting_link;
            }
            $lines[] = 'STATUS:CONFIRMED';
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';
        $icsContent = implode("\r\n", $lines);

        return response($icsContent, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'inline; filename="genial-meetings.ics"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Download single meeting .ics file.
     */
    public function downloadIcs(Meeting $meeting)
    {
        $dtStart = $meeting->start_time->utc()->format('Ymd\THis\Z');
        $dtEnd = $meeting->end_time->utc()->format('Ymd\THis\Z');
        $dtStamp = now()->utc()->format('Ymd\THis\Z');
        $uid = 'genial-meeting-' . $meeting->id . '@' . parse_url(config('app.url', 'http://localhost'), PHP_URL_HOST);

        $summary = str_replace(["\r", "\n", ";", ","], ["", " ", "\\;", "\\,"], $meeting->title);
        $location = str_replace(["\r", "\n", ";", ","], ["", " ", "\\;", "\\,"], $meeting->meeting_link ?: ($meeting->location ?: 'Online'));

        $descParts = [];
        if ($meeting->description) {
            $descParts[] = $meeting->description;
        }
        if ($meeting->meeting_link) {
            $descParts[] = 'Link: ' . $meeting->meeting_link;
        }
        $description = str_replace(["\r", "\n", ";", ","], ["", "\\n", "\\;", "\\,"], implode("\n", $descParts));

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Genial Digital Solution//Meeting Agendas//ID',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:' . $uid,
            'DTSTAMP:' . $dtStamp,
            'DTSTART:' . $dtStart,
            'DTEND:' . $dtEnd,
            'SUMMARY:' . $summary,
            'DESCRIPTION:' . $description,
            'LOCATION:' . $location,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR',
        ];

        return response(implode("\r\n", $lines), 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="meeting-' . $meeting->id . '.ics"',
        ]);
    }
}
