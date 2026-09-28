<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    /**
     * Check if user is connected to Google Calendar API.
     */
    public function isConnected(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return !empty($user->google_refresh_token) || !empty($user->google_access_token);
    }

    /**
     * Get a valid access token for the user, refreshing automatically if needed.
     */
    public function getValidAccessToken(User $user): ?string
    {
        // If access token exists and is still valid for at least 2 minutes, return it
        if (!empty($user->google_access_token) && $user->google_token_expires_at && $user->google_token_expires_at->isAfter(now()->addMinutes(2))) {
            return $user->google_access_token;
        }

        // If no refresh token, we cannot refresh
        if (empty($user->google_refresh_token)) {
            return $user->google_access_token;
        }

        // Refresh access token from Google OAuth endpoint
        try {
            $clientId = config('services.google.client_id');
            $clientSecret = config('services.google.client_secret');

            $response = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'refresh_token' => $user->google_refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $accessToken = $data['access_token'] ?? null;
                $expiresIn = $data['expires_in'] ?? 3600;

                if ($accessToken) {
                    $user->update([
                        'google_access_token' => $accessToken,
                        'google_token_expires_at' => now()->addSeconds($expiresIn),
                    ]);
                    return $accessToken;
                }
            } else {
                Log::warning('Google Calendar token refresh failed', [
                    'user_id' => $user->id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Error refreshing Google token: ' . $e->getMessage());
        }

        return $user->google_access_token;
    }

    /**
     * Create an event directly in Google Calendar via API.
     */
    public function createEvent(Meeting $meeting, ?User $user = null): ?array
    {
        $user = $user ?? $meeting->user ?? auth()->user() ?? User::whereNotNull('google_refresh_token')->first();

        if (!$user || !$this->isConnected($user)) {
            return null;
        }

        $token = $this->getValidAccessToken($user);
        if (!$token) {
            return null;
        }

        $calendarId = $user->google_calendar_id ?: 'primary';
        $tz = config('app.timezone', 'Asia/Jakarta');

        $payload = [
            'summary' => $meeting->title,
            'description' => $this->buildDescription($meeting),
            'start' => [
                'dateTime' => $meeting->start_time->toRfc3339String(),
                'timeZone' => $tz,
            ],
            'end' => [
                'dateTime' => $meeting->end_time->toRfc3339String(),
                'timeZone' => $tz,
            ],
        ];

        if ($meeting->location) {
            $payload['location'] = $meeting->location;
        } elseif ($meeting->meeting_link) {
            $payload['location'] = $meeting->meeting_link;
        }

        // Auto-create official Google Meet conference if platform is google_meet
        if ($meeting->platform === 'google_meet') {
            $payload['conferenceData'] = [
                'createRequest' => [
                    'requestId' => 'genial-' . $meeting->id . '-' . time(),
                    'conferenceSolutionKey' => [
                        'type' => 'hangoutsMeet',
                    ],
                ],
            ];
        }

        try {
            $url = "https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events?conferenceDataVersion=1";
            $response = Http::withToken($token)
                ->timeout(15)
                ->post($url, $payload);

            if ($response->successful()) {
                $result = $response->json();
                $eventId = $result['id'] ?? null;
                $meetLink = $result['hangoutLink'] ?? null;

                $updateData = [];
                if ($eventId) {
                    $updateData['google_event_id'] = $eventId;
                }
                if ($meetLink && (empty($meeting->meeting_link) || str_contains($meeting->meeting_link, 'meet.google.com/new'))) {
                    $updateData['meeting_link'] = $meetLink;
                    $updateData['google_meet_link'] = $meetLink;
                }

                if (!empty($updateData)) {
                    $meeting->updateQuietly($updateData);
                }

                return $result;
            } else {
                Log::warning('Google Calendar API create event failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Error calling Google Calendar API createEvent: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Update an event in Google Calendar via API.
     */
    public function updateEvent(Meeting $meeting, ?User $user = null): ?array
    {
        if (empty($meeting->google_event_id)) {
            // If never synced before, create it
            return $this->createEvent($meeting, $user);
        }

        $user = $user ?? $meeting->user ?? auth()->user() ?? User::whereNotNull('google_refresh_token')->first();
        if (!$user || !$this->isConnected($user)) {
            return null;
        }

        $token = $this->getValidAccessToken($user);
        if (!$token) {
            return null;
        }

        $calendarId = $user->google_calendar_id ?: 'primary';
        $tz = config('app.timezone', 'Asia/Jakarta');

        $payload = [
            'summary' => $meeting->title,
            'description' => $this->buildDescription($meeting),
            'start' => [
                'dateTime' => $meeting->start_time->toRfc3339String(),
                'timeZone' => $tz,
            ],
            'end' => [
                'dateTime' => $meeting->end_time->toRfc3339String(),
                'timeZone' => $tz,
            ],
        ];

        if ($meeting->location) {
            $payload['location'] = $meeting->location;
        } elseif ($meeting->meeting_link) {
            $payload['location'] = $meeting->meeting_link;
        }

        try {
            $url = "https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$meeting->google_event_id}";
            $response = Http::withToken($token)
                ->timeout(15)
                ->patch($url, $payload);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Throwable $e) {
            Log::error('Error updating Google Calendar event: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Delete an event from Google Calendar via API.
     */
    public function deleteEvent(Meeting $meeting, ?User $user = null): bool
    {
        if (empty($meeting->google_event_id)) {
            return true;
        }

        $user = $user ?? $meeting->user ?? auth()->user() ?? User::whereNotNull('google_refresh_token')->first();
        if (!$user || !$this->isConnected($user)) {
            return false;
        }

        $token = $this->getValidAccessToken($user);
        if (!$token) {
            return false;
        }

        $calendarId = $user->google_calendar_id ?: 'primary';

        try {
            $url = "https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$meeting->google_event_id}";
            $response = Http::withToken($token)
                ->timeout(10)
                ->delete($url);

            return $response->successful() || $response->status() === 404;
        } catch (\Throwable $e) {
            Log::error('Error deleting Google Calendar event: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Build rich description for Google Calendar event.
     */
    protected function buildDescription(Meeting $meeting): string
    {
        $parts = [];

        if ($meeting->description) {
            $parts[] = $meeting->description;
        }

        if ($meeting->project) {
            $parts[] = "Project: " . $meeting->project->name . " (" . $meeting->project->client . ")";
        }

        if ($meeting->meeting_link) {
            $parts[] = "Meeting Link: " . $meeting->meeting_link;
        }

        $parts[] = "Disinkronkan otomatis via Genial Digital Solution";

        return implode("\n\n", $parts);
    }
}
