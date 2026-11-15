<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\CreativeService;
use App\Models\Setting;
use App\Services\ClientPortal\ClientScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CreativeServiceController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        // The catalog is global, but the scope still enforces the client-only role check.
        ClientScope::for($request);

        $services = CreativeService::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        // Explicit DTO: freelancer_cost and estimated_margin must never be serialised.
        $serviceList = [];
        foreach ($services as $service) {
            $serviceList[] = [
                'id' => $service->id,
                'name' => $service->name,
                'category' => $service->category,
                'format' => $service->format,
                'description' => $service->description,
                'deliverables' => $service->deliverables,
                'client_price' => (float) $service->client_price,
                'unit' => $service->unit,
                'turnaround_days' => is_numeric($turnaround = $service->getAttribute('turnaround_days')) ? (int) $turnaround : null,
            ];
        }

        return Inertia::render('client/catalog', [
            'services' => $serviceList,
            'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        ]);
    }
}
