<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meeting extends Model
{
    protected $fillable = [
        'title',
        'description',
        'start_time',
        'end_time',
        'platform',
        'meeting_link',
        'location',
        'project_id',
        'user_id',
        'attendees',
        'status',
        'google_event_id',
        'google_meet_link',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'attendees' => 'array',
    ];

    protected $appends = [
        'google_calendar_url',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate 1-click Google Calendar web intent URL
     */
    public function getGoogleCalendarUrlAttribute(): string
    {
        if (!$this->start_time || !$this->end_time) {
            return '#';
        }

        $start = $this->start_time->copy()->utc()->format('Ymd\THis\Z');
        $end = $this->end_time->copy()->utc()->format('Ymd\THis\Z');
        $text = urlencode($this->title);

        $detailsParts = [];
        if ($this->description) {
            $detailsParts[] = $this->description;
        }
        if ($this->meeting_link) {
            $detailsParts[] = "Meeting Link: " . $this->meeting_link;
        }
        if ($this->project) {
            $detailsParts[] = "Project: " . $this->project->name . " (" . $this->project->client . ")";
        }
        $details = urlencode(implode("\n\n", $detailsParts));

        $location = urlencode($this->meeting_link ?: ($this->location ?: 'Online'));

        return "https://calendar.google.com/calendar/render?action=TEMPLATE&text={$text}&dates={$start}/{$end}&details={$details}&location={$location}";
    }
}
