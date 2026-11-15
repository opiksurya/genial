<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectShopeeConfig;
use App\Models\ShopeeConnectLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff-side management of the links a shop owner opens to authorize their own Shopee shop.
 */
class ShopeeConnectLinkController extends Controller
{
    /**
     * Links that can still be used. The link addresses themselves are never available again after creation.
     */
    public function index(Project $project): JsonResponse
    {
        $links = $project->shopeeConnectLinks()
            ->usable()
            ->latest()
            ->get(['id', 'expires_at', 'created_at'])
            ->map(fn (ShopeeConnectLink $link): array => [
                'id' => $link->id,
                'created_at' => $link->created_at->toIso8601String(),
                'expires_at' => $link->expires_at->toIso8601String(),
            ]);

        return response()->json(['links' => $links]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['nullable', 'integer', 'min:1', 'max:'.ShopeeConnectLink::MAX_DAYS],
        ]);

        $config = $project->shopeeConfig ?: new ProjectShopeeConfig(['project_id' => $project->id]);

        if (! $config->hasCredentials()) {
            return response()->json([
                'message' => 'Aplikasi Shopee belum disiapkan. Isi kredensial Shopee (Partner ID dan Key) terlebih dahulu.',
            ], 422);
        }

        ['link' => $link, 'token' => $token] = ShopeeConnectLink::issue(
            $project,
            (int) ($validated['days'] ?? ShopeeConnectLink::DEFAULT_DAYS),
            $request->user()->id,
        );

        return response()->json([
            'id' => $link->id,
            'url' => route('shopee.connect.show', ['token' => $token]),
            'expires_at' => $link->expires_at->toIso8601String(),
        ], 201);
    }

    public function destroy(Project $project, ShopeeConnectLink $link): JsonResponse
    {
        abort_unless($link->project_id === $project->id, 404);

        if ($link->revoked_at === null) {
            $link->update(['revoked_at' => now()]);
        }

        return response()->json(['revoked' => true]);
    }
}
