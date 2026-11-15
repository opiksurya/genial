<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'claudeOfficeUrl' => $request->user()?->hasRole('Super Admin') ? config('services.claude_office.url') : null,
            'canAccessFinance' => $request->user()?->hasAnyRole(['Super Admin', 'Admin']) ?? false,
            'canManageRoles' => $request->user()?->hasRole('Super Admin') ?? false,
            'canManageUsers' => $request->user()?->hasRole('Super Admin') ?? false,
            'shopeeApp' => [
                'hasSharedApp' => filled(config('services.shopee.partner_id')) && filled(config('services.shopee.partner_key')),
                'canManageCredentials' => $request->user()?->hasRole('Super Admin') ?? false,
                'sandbox' => (bool) config('services.shopee.sandbox'),
                'redirectUri' => config('services.shopee.redirect') ?: route('auth.shopee.callback'),
                'webhookUrl' => config('services.shopee.webhook_url') ?: route('webhooks.shopee'),
            ],
            'portalNav' => $this->portalNav($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'metaPixel' => [
                'pixel_id' => \App\Models\Setting::get('meta_pixel_id', ''),
                'enabled' => \App\Models\Setting::get('meta_enabled', '0') === '1',
            ],
            'gtm' => [
                'gtm_id' => \App\Models\Setting::get('gtm_id', ''),
                'enabled' => \App\Models\Setting::get('gtm_enabled', '0') === '1',
            ],
            'ga4' => [
                'ga4_id' => \App\Models\Setting::get('ga4_id', ''),
                'enabled' => \App\Models\Setting::get('ga4_enabled', '0') === '1',
            ],
        ];
    }

    /**
     * Sidebar for member-only roles (Client/Reviewer), chosen on the server so no
     * internal menu ever reaches their browser. Null for everyone else.
     *
     * @return list<array{key: string, title: string, href: string}>|null
     */
    private function portalNav(Request $request): ?array
    {
        if (! $request->user()?->hasAnyRole(Project::MEMBER_ONLY_ROLES)) {
            return null;
        }

        $items = [
            ['dashboard', 'Dashboard', 'client.dashboard'],
            ['projectflow', 'ProjectFlow', 'client.projectflow.index'],
            ['meetings', 'Agenda Meeting', 'client.meetings.index'],
            ['freelancers', 'Freelancer Hub', 'client.freelancers.index'],
            ['catalog', 'Katalog Digital Kreatif', 'client.catalog.index'],
            ['shopee', 'Shopee Analytics', 'shopee.index'],
            ['meta-ads', 'Meta Ads Analytics', 'meta-ads.index'],
        ];

        return array_map(
            fn (array $item) => ['key' => $item[0], 'title' => $item[1], 'href' => route($item[2], absolute: false)],
            $items,
        );
    }
}
