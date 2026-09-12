<?php

namespace App\Http\Controllers;

use App\Services\MetaCapiService;
use Illuminate\Http\Request;

class MetaCapiController extends Controller
{
    /**
     * Track a client-side CAPI event (e.g. WhatsApp Lead click).
     */
    public function track(Request $request)
    {
        $validated = $request->validate([
            'event_name' => 'required|string',
            'event_id' => 'required|string',
            'source_url' => 'nullable|string',
            'custom_data' => 'nullable|array',
        ]);

        $userData = [
            'client_ip_address' => $request->ip(),
            'client_user_agent' => $request->userAgent(),
            'fbp' => $request->cookie('_fbp'),
            'fbc' => $request->cookie('_fbc'),
        ];

        $success = MetaCapiService::sendEvent(
            $validated['event_name'],
            $userData,
            $validated['custom_data'] ?? ['content_name' => 'WhatsApp Contact Click'],
            $validated['event_id'],
            $validated['source_url'] ?? $request->header('referer')
        );

        return response()->json([
            'success' => $success,
        ]);
    }
}
