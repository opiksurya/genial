<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMetaConfig;
use App\Services\MetaClientService;
use Illuminate\Http\Request;

class ProjectMetaController extends Controller
{
    /**
     * Store or update Meta connection settings for a client's project.
     */
    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'ad_account_id' => 'required|string|max:100',
            'pixel_id' => 'nullable|string|max:100',
            'access_token' => 'nullable|string',
        ]);

        $config = $project->metaConfig ?: new ProjectMetaConfig(['project_id' => $project->id]);

        $config->ad_account_id = MetaClientService::formatAdAccountId($validated['ad_account_id']);
        $config->pixel_id = !empty($validated['pixel_id']) ? trim($validated['pixel_id']) : null;

        // Only update token if provided (preserves existing token on simple edits)
        if (!empty($validated['access_token'])) {
            $config->access_token = trim($validated['access_token']);
        }

        $config->save();

        // Immediately attempt to sync & verify connection with Meta Graph API
        $syncResult = MetaClientService::syncAccount($config);

        if ($syncResult['success']) {
            return back()->with('success', $syncResult['message']);
        }

        return back()->with('warning', 'Konfigurasi tersimpan, namun koneksi Meta gagal: ' . $syncResult['message']);
    }

    /**
     * Test connection on-the-fly (Ajax / API).
     */
    public function testConnection(Request $request, Project $project)
    {
        $validated = $request->validate([
            'ad_account_id' => 'required|string|max:100',
            'access_token' => 'nullable|string',
        ]);

        $token = !empty($validated['access_token']) 
            ? trim($validated['access_token']) 
            : $project->metaConfig?->access_token;

        if (empty($token)) {
            return response()->json([
                'success' => false,
                'message' => 'Access Token belum diisi atau belum tersimpan.',
            ], 422);
        }

        $result = MetaClientService::testConnection($validated['ad_account_id'], $token);

        return response()->json($result);
    }

    /**
     * Force sync latest data from Meta.
     */
    public function sync(Project $project)
    {
        $config = $project->metaConfig;

        if (!$config) {
            return back()->with('error', 'Koneksi Meta belum dikonfigurasi untuk project ini.');
        }

        $result = MetaClientService::syncAccount($config);

        if ($result['success']) {
            return back()->with('success', $result['message']);
        }

        return back()->with('error', $result['message']);
    }

    /**
     * Disconnect / clear Meta integration for this client.
     */
    public function destroy(Project $project)
    {
        $project->metaConfig?->delete();

        return back()->with('success', 'Koneksi Meta Ads untuk client ini berhasil diputus.');
    }
}
