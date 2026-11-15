<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deny by default for the outside roles (Client and Reviewer): they may only use the client portal, their own
 * profile and password settings, and the Shopee and Meta analytics pages (and the endpoints those pages call)
 * for the projects they belong to. Everything else is refused, so a page added later stays closed to them
 * until it is listed here.
 */
class ConfineReviewer
{
    /**
     * Route name patterns a Client or Reviewer may use.
     *
     * @var list<string>
     */
    public const ALLOWED_ROUTES = [
        'client.*',
        'profile.edit',
        'profile.update',
        'security.edit',
        'user-password.update',
        'appearance.edit',
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

        if (! $user || ! $user->hasAnyRole(Project::MEMBER_ONLY_ROLES) || $request->routeIs(self::ALLOWED_ROUTES)) {
            return $next($request);
        }

        // Landing on /dashboard after login (or following any stray link) takes the client to the client portal.
        if ($request->isMethod('GET') && ! $request->expectsJson()) {
            return redirect()->route('client.dashboard');
        }

        abort(403, 'Akun klien hanya dapat membuka portal klien, analitik Shopee, dan Meta.');
    }
}
