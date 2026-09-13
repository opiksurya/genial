<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the users with roles and project memberships.
     */
    public function index()
    {
        $users = User::with(['roles', 'projects'])->latest()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'roles' => $user->roles->pluck('name'),
                'project_ids' => $user->projects->pluck('id'),
                'assigned_projects' => $user->projects->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'name' => $p->name,
                        'client' => $p->client,
                    ];
                }),
                'created_at' => $user->created_at->format('d M Y, H:i'),
            ];
        });

        $roles = Role::pluck('name');
        $allProjects = Project::select('id', 'name', 'client')->latest()->get();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'projects' => $allProjects,
        ]);
    }

    /**
     * Store a newly created user with role and optional project assignments.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'exists:projects,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);

        if (!empty($validated['project_ids'])) {
            foreach ($validated['project_ids'] as $projectId) {
                ProjectMember::create([
                    'project_id' => $projectId,
                    'user_id' => $user->id,
                    'role' => $validated['role'] === 'Client' ? 'Client' : 'Member',
                ]);
            }
        }

        return back()->with('success', 'User baru berhasil ditambahkan.');
    }

    /**
     * Update the specified user, their role, and project assignments.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|exists:roles,name',
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'exists:projects,id',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);
        $user->syncRoles([$validated['role']]);

        // Sync Project Memberships
        ProjectMember::where('user_id', $user->id)->delete();
        if (!empty($validated['project_ids'])) {
            foreach ($validated['project_ids'] as $projectId) {
                ProjectMember::create([
                    'project_id' => $projectId,
                    'user_id' => $user->id,
                    'role' => $validated['role'] === 'Client' ? 'Client' : 'Member',
                ]);
            }
        }

        return back()->with('success', 'Data user berhasil diperbarui.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        if (auth()->id() === $user->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        // Clean up project memberships before deletion
        ProjectMember::where('user_id', $user->id)->delete();
        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }
}
