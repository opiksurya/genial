<?php

namespace App\Http\Controllers;

use App\Models\AuditRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class AuditRequestController extends Controller
{
    /**
     * Store a newly created audit request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'whatsapp' => 'required|string|max:50',
            'website_marketplace' => 'required|string|max:255',
            'business_type' => 'required|string|max:255',
            'target_sales' => 'required|string|max:255',
        ]);

        $validated['ip_address'] = $request->ip();

        $audit = AuditRequest::create($validated);

        // Send server-side Meta CAPI Lead Event for Audit Form Submit
        \App\Services\MetaCapiService::sendEvent(
            'Lead',
            [
                'phone' => $audit->whatsapp,
                'first_name' => $audit->name,
                'client_ip_address' => $request->ip(),
                'client_user_agent' => $request->userAgent(),
                'fbp' => $request->cookie('_fbp'),
                'fbc' => $request->cookie('_fbc'),
            ],
            [
                'content_name' => 'Audit Form Submission',
                'business_type' => $audit->business_type,
            ],
            $request->header('X-Meta-Event-ID')
        );

        // Format WhatsApp message for instant consultation redirect
        $phone = '6281234567890'; // Agency Official WhatsApp Number
        $message = rawurlencode(
            "Halo Genial Digital Solution! Saya ingin klaim Audit Digital Gratis untuk bisnis saya.\n\n".
            "*Nama:* {$audit->name}\n".
            "*WhatsApp:* {$audit->whatsapp}\n".
            "*Website/Marketplace:* {$audit->website_marketplace}\n".
            "*Jenis Bisnis:* {$audit->business_type}\n".
            "*Target Penjualan:* {$audit->target_sales}"
        );

        $whatsappUrl = "https://wa.me/{$phone}?text={$message}";

        return Redirect::back()->with('success', 'Form Audit Digital berhasil dikirim! Tim konsultan kami akan segera menghubungi Anda.')->with('whatsapp_url', $whatsappUrl);
    }
}
