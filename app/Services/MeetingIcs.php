<?php

namespace App\Services;

use App\Models\Meeting;

/**
 * Builds the .ics (iCalendar) body for a single meeting. Shared by the staff
 * and client-portal download endpoints. The client portal passes $includeDescription = false so internal
 * notes in the description never leave the building.
 */
final class MeetingIcs
{
    public static function render(Meeting $meeting, bool $includeDescription = true): string
    {
        $dtStart = $meeting->start_time->utc()->format('Ymd\THis\Z');
        $dtEnd = $meeting->end_time->utc()->format('Ymd\THis\Z');
        $dtStamp = now()->utc()->format('Ymd\THis\Z');
        $uid = 'genial-meeting-'.$meeting->id.'@'.parse_url(config('app.url', 'http://localhost'), PHP_URL_HOST);

        $summary = str_replace(["\r", "\n", ';', ','], ['', ' ', "\;", '\\,'], $meeting->title);
        $location = str_replace(["\r", "\n", ';', ','], ['', ' ', "\;", '\\,'], $meeting->meeting_link ?: ($meeting->location ?: 'Online'));

        $descParts = [];
        if ($includeDescription && $meeting->description) {
            $descParts[] = $meeting->description;
        }
        if ($meeting->meeting_link) {
            $descParts[] = 'Link: '.$meeting->meeting_link;
        }
        $description = str_replace(["\r", "\n", ';', ','], ['', '\\n', "\;", '\\,'], implode("\n", $descParts));

        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Genial Digital Solution//Meeting Agendas//ID',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:'.$uid,
            'DTSTAMP:'.$dtStamp,
            'DTSTART:'.$dtStart,
            'DTEND:'.$dtEnd,
            'SUMMARY:'.$summary,
            'DESCRIPTION:'.$description,
            'LOCATION:'.$location,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR',
        ];

        return implode("\r\n", $lines);
    }
}
