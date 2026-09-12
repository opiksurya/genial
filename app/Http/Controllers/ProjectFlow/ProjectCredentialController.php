<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectCredential;
use Illuminate\Http\Request;

class ProjectCredentialController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'platform' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'username_email' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'url_link' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);

        $validated['project_id'] = $project->id;
        $validated['created_by'] = auth()->id();

        ProjectCredential::create($validated);

        return back()->with('success', 'Akses kredensial berhasil ditambahkan.');
    }

    public function update(Request $request, ProjectCredential $credential)
    {
        $validated = $request->validate([
            'platform' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'username_email' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'url_link' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $credential->update($validated);

        return back()->with('success', 'Akses kredensial berhasil diperbarui.');
    }

    public function destroy(ProjectCredential $credential)
    {
        $credential->delete();

        return back()->with('success', 'Akses kredensial berhasil dihapus.');
    }
}
