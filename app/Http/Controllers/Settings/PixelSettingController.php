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
     * Show Meta Pixel, GTM & WhatsApp settings page.
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
                'whatsapp_number' => Setting::get('whatsapp_number', '6281234567890'),
                'whatsapp_default_message' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing'),
            ],
            'status' => session('status'),
        ]);
    }

    /**
     * Update Meta Pixel, CAPI, GTM & WhatsApp settings.
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
            'whatsapp_number' => 'nullable|string|max:50',
            'whatsapp_default_message' => 'nullable|string|max:500',
        ]);

        Setting::set('meta_pixel_id', $validated['meta_pixel_id'] ?? '');
        Setting::set('meta_access_token', $validated['meta_access_token'] ?? '');
        Setting::set('meta_test_event_code', $validated['meta_test_event_code'] ?? '');
        Setting::set('meta_enabled', !empty($validated['meta_enabled']) ? '1' : '0');

        Setting::set('gtm_id', $validated['gtm_id'] ?? '');
        Setting::set('gtm_enabled', !empty($validated['gtm_enabled']) ? '1' : '0');

        // Sanitize WhatsApp Phone Number (e.g. 0812... -> 62812...)
        if (!empty($validated['whatsapp_number'])) {
            $phone = preg_replace('/[^0-9]/', '', $validated['whatsapp_number']);
            if (str_starts_with($phone, '0')) {
                $phone = '62' . substr($phone, 1);
            }
            Setting::set('whatsapp_number', $phone);
        }

        if (isset($validated['whatsapp_default_message'])) {
            Setting::set('whatsapp_default_message', $validated['whatsapp_default_message']);
        }

        return redirect()->route('pixel.edit')->with('status', 'Pengaturan Tracking & Kontak WhatsApp berhasil disimpan.');
    }
}
