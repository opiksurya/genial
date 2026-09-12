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
     * Show Meta Pixel & CAPI settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/pixel', [
            'settings' => [
                'meta_pixel_id' => Setting::get('meta_pixel_id', ''),
                'meta_access_token' => Setting::get('meta_access_token', ''),
                'meta_test_event_code' => Setting::get('meta_test_event_code', ''),
                'meta_enabled' => Setting::get('meta_enabled', '0') === '1',
            ],
            'status' => session('status'),
        ]);
    }

    /**
     * Update Meta Pixel & CAPI settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'meta_pixel_id' => 'nullable|string|max:255',
            'meta_access_token' => 'nullable|string',
            'meta_test_event_code' => 'nullable|string|max:255',
            'meta_enabled' => 'boolean',
        ]);

        Setting::set('meta_pixel_id', $validated['meta_pixel_id'] ?? '');
        Setting::set('meta_access_token', $validated['meta_access_token'] ?? '');
        Setting::set('meta_test_event_code', $validated['meta_test_event_code'] ?? '');
        Setting::set('meta_enabled', !empty($validated['meta_enabled']) ? '1' : '0');

        return redirect()->route('pixel.edit')->with('status', 'Pengaturan Meta Pixel & CAPI berhasil disimpan.');
    }
}
