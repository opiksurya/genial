<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only the outside roles (Client, Reviewer) belong in the client portal; internal staff use the main app.
 */
class EnsureClientPortalUser
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->hasAnyRole(Project::MEMBER_ONLY_ROLES), 403);

        return $next($request);
    }
}
