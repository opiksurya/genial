<?php

namespace App\Http\Controllers;

use App\Models\AuditRequest;
use App\Models\Setting;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Executive Dashboard.
     */
    public function index(): Response
    {
        $totalLeads = AuditRequest::count();
        $totalUsers = User::count();
        $totalRoles = \Spatie\Permission\Models\Role::count();
        $metaEnabled = Setting::get('meta_enabled', '0') === '1';
        $metaPixelId = Setting::get('meta_pixel_id', '');

        $recentLeads = AuditRequest::latest()
            ->take(5)
            ->get()
            ->map(function ($lead) {
                $phone = preg_replace('/[^0-9]/', '', $lead->whatsapp);
                if (!str_starts_with($phone, '62') && str_starts_with($phone, '0')) {
                    $phone = '62' . substr($phone, 1);
                }
                $message = rawurlencode("Halo {$lead->name}, terima kasih telah mengajukan Audit Digital di Genial Digital Solution. Tim kami ingin mendiskusikan hasil audit bisnis Anda.");
                $lead->whatsapp_link = "https://wa.me/{$phone}?text={$message}";
                return $lead;
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'total_leads' => $totalLeads,
                'total_users' => $totalUsers,
                'total_roles' => $totalRoles,
                'meta_pixel_active' => $metaEnabled && !empty($metaPixelId),
                'meta_pixel_id' => $metaPixelId,
            ],
            'recentLeads' => $recentLeads,
        ]);
    }
}
