<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PixelSettingController extends Controller
{
    /**
     * Show Meta Pixel, GA4 & GTM settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/pixel', [
            'settings' => [
                'meta_pixel_id' => Setting::get('meta_pixel_id', ''),
                'meta_access_token' => Setting::get('meta_access_token', ''),
                'meta_test_event_code' => Setting::get('meta_test_event_code', ''),
                'meta_enabled' => Setting::get('meta_enabled', '0') === '1',
                'gtm_id' => Setting::get('gtm_id', ''),
                'gtm_enabled' => Setting::get('gtm_enabled', '0') === '1',
                'ga4_id' => Setting::get('ga4_id', 'G-YRNS0SP4P7'),
                'ga4_enabled' => Setting::get('ga4_enabled', '1') === '1',
            ],
            'status' => session('status'),
        ]);
    }

    /**
     * Update Meta Pixel, CAPI, GA4 & GTM settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'meta_pixel_id' => 'nullable|string|max:255',
            'meta_access_token' => 'nullable|string',
            'meta_test_event_code' => 'nullable|string|max:255',
            'meta_enabled' => 'boolean',
            'gtm_id' => 'nullable|string|max:255',
            'gtm_enabled' => 'boolean',
            'ga4_id' => 'nullable|string|max:255',
            'ga4_enabled' => 'boolean',
        ]);

        Setting::set('meta_pixel_id', $validated['meta_pixel_id'] ?? '');
        Setting::set('meta_access_token', $validated['meta_access_token'] ?? '');
        Setting::set('meta_test_event_code', $validated['meta_test_event_code'] ?? '');
        Setting::set('meta_enabled', !empty($validated['meta_enabled']) ? '1' : '0');

        Setting::set('gtm_id', $validated['gtm_id'] ?? '');
        Setting::set('gtm_enabled', !empty($validated['gtm_enabled']) ? '1' : '0');

        Setting::set('ga4_id', $validated['ga4_id'] ?? '');
        Setting::set('ga4_enabled', !empty($validated['ga4_enabled']) ? '1' : '0');

        return redirect()->route('pixel.edit')->with('status', 'Pengaturan Tracking & Analytics (GA4, GTM & Meta Pixel) berhasil disimpan.');
    }
}
