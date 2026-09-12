<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaCapiService
{
    /**
     * Send a Conversions API event to Meta.
     */
    public static function sendEvent(
        string $eventName,
        array $userData = [],
        array $customData = [],
        ?string $eventId = null,
        ?string $sourceUrl = null
    ): bool {
        $enabled = Setting::get('meta_enabled', '0');
        $pixelId = Setting::get('meta_pixel_id');
        $accessToken = Setting::get('meta_access_token');
        $testEventCode = Setting::get('meta_test_event_code');

        if ($enabled !== '1' || empty($pixelId) || empty($accessToken)) {
            return false;
        }

        // Format user data with SHA-256 hashing where required by Meta CAPI spec
        $formattedUserData = [];

        if (!empty($userData['email'])) {
            $formattedUserData['em'] = [hash('sha256', strtolower(trim($userData['email'])))];
        }
        if (!empty($userData['phone'])) {
            $phone = preg_replace('/[^0-9]/', '', $userData['phone']);
            $formattedUserData['ph'] = [hash('sha256', $phone)];
        }
        if (!empty($userData['first_name'])) {
            $formattedUserData['fn'] = [hash('sha256', strtolower(trim($userData['first_name'])))];
        }
        if (!empty($userData['client_ip_address'])) {
            $formattedUserData['client_ip_address'] = $userData['client_ip_address'];
        }
        if (!empty($userData['client_user_agent'])) {
            $formattedUserData['client_user_agent'] = $userData['client_user_agent'];
        }
        if (!empty($userData['fbp'])) {
            $formattedUserData['fbp'] = $userData['fbp'];
        }
        if (!empty($userData['fbc'])) {
            $formattedUserData['fbc'] = $userData['fbc'];
        }

        $eventPayload = [
            'event_name' => $eventName,
            'event_time' => time(),
            'event_id' => $eventId ?? (string) \Illuminate\Support\Str::uuid(),
            'event_source_url' => $sourceUrl ?? request()->fullUrl(),
            'action_source' => 'website',
            'user_data' => $formattedUserData,
            'custom_data' => array_merge([
                'currency' => 'IDR',
                'value' => 0.00,
            ], $customData),
        ];

        $postData = [
            'data' => [$eventPayload],
        ];

        if (!empty($testEventCode)) {
            $postData['test_event_code'] = $testEventCode;
        }

        try {
            $url = "https://graph.facebook.com/v19.0/{$pixelId}/events?access_token={$accessToken}";
            $response = Http::post($url, $postData);

            if ($response->failed()) {
                Log::error('Meta CAPI Error: '.$response->body());
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Meta CAPI Exception: '.$e->getMessage());
            return false;
        }
    }
}
