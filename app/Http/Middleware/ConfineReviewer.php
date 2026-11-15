<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deny by default for the Reviewer role: an outside reviewer may only use the Shopee and Meta analytics
 * pages (and the endpoints those pages call) for the projects they belong to. Everything else is refused,
 * so a page added later stays closed to reviewers until it is listed here.
 */
class ConfineReviewer
{
    /**
     * Route name patterns a Reviewer may use.
     *
     * @var list<string>
     */
    public const ALLOWED_ROUTES = [
        'shopee.index',
        'projects.shopee.*',
        'meta-ads.index',
        'meta-ads.connect',
        'meta-ads.callback',
        'projects.meta.*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('Reviewer') || $request->routeIs(self::ALLOWED_ROUTES)) {
            return $next($request);
        }

        // Landing on /dashboard after login (or following any stray link) takes the reviewer to the Shopee page.
        if ($request->isMethod('GET') && ! $request->expectsJson()) {
            return redirect()->route('shopee.index');
        }

        abort(403, 'Akun reviewer hanya dapat membuka halaman analitik Shopee dan Meta.');
    }
}
