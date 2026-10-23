<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ClaudeOfficeAuthController extends Controller
{
    /**
     * Auth check for the Claude Office subdomain, called by Nginx auth_request.
     *
     * Answers with a bare status code instead of redirecting, because
     * auth_request only understands 2xx, 401 and 403.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->noContent(401);
        }

        if (! $user->hasRole('Super Admin')) {
            return response()->noContent(403);
        }

        return response()->noContent();
    }
}
