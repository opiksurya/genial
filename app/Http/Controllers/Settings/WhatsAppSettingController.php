<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppSettingController extends Controller
{
    /**
     * Show WhatsApp contact settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/whatsapp', [
            'settings' => [
                'whatsapp_number' => Setting::get('whatsapp_number', '6281234567890'),
                'whatsapp_default_message' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing'),
            ],
            'status' => session('status'),
        ]);
    }

    /**
     * Update WhatsApp contact settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'whatsapp_number' => 'required|string|max:50',
            'whatsapp_default_message' => 'nullable|string|max:500',
        ]);

        // Sanitize WhatsApp Phone Number (e.g. 0812... -> 62812...)
        $phone = preg_replace('/[^0-9]/', '', $validated['whatsapp_number']);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        Setting::set('whatsapp_number', $phone);

        if (isset($validated['whatsapp_default_message'])) {
            Setting::set('whatsapp_default_message', $validated['whatsapp_default_message']);
        }

        return redirect()->route('whatsapp.edit')->with('status', 'Pengaturan Kontak WhatsApp resmi berhasil diperbarui.');
    }
}
