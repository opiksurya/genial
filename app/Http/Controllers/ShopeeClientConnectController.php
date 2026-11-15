<?php

namespace App\Http\Controllers;

use App\Models\ProjectShopeeConfig;
use App\Models\ShopeeConnectLink;
use App\Services\Shopee\ShopeeClientService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Public pages a shop owner uses to authorize their own Shopee shop through a link from our team.
 * No account is needed; the link token is the only credential and it is single-use.
 */
class ShopeeClientConnectController extends Controller
{
    public const STATE_TTL_SECONDS = 600;

    /**
     * The page the shop owner lands on. Every unusable link answers the same way so links cannot be probed.
     */
    public function show(string $token): SymfonyResponse
    {
        $link = ShopeeConnectLink::findByToken($token);

        if (! $link || ! $link->isUsable()) {
            return $this->respond($this->page('invalid'), Response::HTTP_GONE);
        }

        return $this->respond($this->page('ready', [
            'clientName' => $link->project->client ?: $link->project->name,
            'expiresAt' => $link->expires_at->toIso8601String(),
            'startUrl' => route('shopee.connect.start', ['token' => $token]),
        ]));
    }

    /**
     * Send the shop owner to Shopee. The state is tied to this link and to this browser session.
     */
    public function start(Request $request, string $token): RedirectResponse
    {
        $link = ShopeeConnectLink::findByToken($token);

        if (! $link || ! $link->isUsable()) {
            return redirect()->route('shopee.connect.show', ['token' => $token]);
        }

        $config = $link->project->shopeeConfig ?: new ProjectShopeeConfig(['project_id' => $link->project_id]);

        if (! $config->hasCredentials()) {
            return $this->finish('error', 'Layanan penghubung Shopee belum siap. Hubungi tim kami.');
        }

        $state = Str::random(40);

        Cache::put("shopee_oauth:{$state}", [
            'flow' => 'client',
            'project_id' => $link->project_id,
            'link_id' => $link->id,
        ], self::STATE_TTL_SECONDS);
        // Binds the callback to the browser that started it, so a pasted callback URL cannot connect someone else's shop.
        $request->session()->put('shopee_client_state', $state);

        $redirectUri = (config('services.shopee.redirect') ?: route('auth.shopee.callback')).'?'.http_build_query(['state' => $state]);

        return redirect()->away(ShopeeClientService::generateAuthUrl(
            $config->resolvedPartnerId(),
            $config->resolvedPartnerKey(),
            $redirectUri,
            $config->resolvedIsSandbox(),
        ));
    }

    /**
     * Where the shop owner ends up after Shopee, whatever the result.
     */
    public function done(Request $request): SymfonyResponse
    {
        $result = $request->session()->pull('shopee_connect_result');

        if (! is_array($result)) {
            return $this->respond($this->page('invalid'), Response::HTTP_GONE);
        }

        return $this->respond($this->page($result['status'] === 'success' ? 'done' : 'error', [
            'shopName' => $result['shop_name'] ?? null,
            'message' => $result['message'] ?? null,
        ]));
    }

    /**
     * Used by the OAuth callback to hand the result to the public result page.
     */
    public function finish(string $status, ?string $message = null, ?string $shopName = null): RedirectResponse
    {
        session()->put('shopee_connect_result', [
            'status' => $status,
            'message' => $message,
            'shop_name' => $shopName,
        ]);

        return redirect()->route('shopee.connect.done');
    }

    /**
     * The link is the only credential, so keep it out of referrers, caches, and search engines.
     */
    private function respond(\Inertia\Response $page, int $status = Response::HTTP_OK): SymfonyResponse
    {
        return $page->toResponse(request())
            ->setStatusCode($status)
            ->header('Referrer-Policy', 'no-referrer')
            ->header('Cache-Control', 'no-store, private')
            ->header('X-Robots-Tag', 'noindex, nofollow');
    }

    /**
     * @param  array<string, mixed>  $props
     */
    private function page(string $status, array $props = []): \Inertia\Response
    {
        return Inertia::render('shopee/connect', ['status' => $status, ...$props]);
    }
}
