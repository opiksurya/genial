<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;

/**
 * The single Meta (Facebook) App shared by every brand.
 * Saved once by a Super Admin; falls back to META_APP_ID / META_APP_SECRET.
 */
class MetaAppCredentials
{
    public static function appId(): ?string
    {
        return Setting::get('meta_app_id') ?: (config('services.facebook.client_id') ?: null);
    }

    public static function appSecret(): ?string
    {
        $stored = Setting::get('meta_app_secret');

        if ($stored) {
            try {
                return Crypt::decryptString($stored);
            } catch (\Throwable) {
                // fall through to config
            }
        }

        return config('services.facebook.client_secret') ?: null;
    }

    public static function isConfigured(): bool
    {
        return filled(self::appId()) && filled(self::appSecret());
    }

    public static function save(string $appId, string $appSecret): void
    {
        Setting::set('meta_app_id', trim($appId));
        Setting::set('meta_app_secret', Crypt::encryptString(trim($appSecret)));
    }
}
