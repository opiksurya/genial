<?php

namespace App\Http\Controllers\ProjectFlow;

use App\Http\Controllers\Controller;
use App\Models\ProjectMember;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectTeamController extends Controller
{
    public function index(): Response
    {
        $rolesList = [
            'Project Manager',
            'Designer',
            'Developer',
            'Ads Specialist',
            'SEO Specialist',
            'Content Writer',
        ];

        $users = User::select('id', 'name', 'email', 'avatar', 'created_at')
            ->with(['roles'])
            ->get()
            ->map(function ($u) {
                $u->assigned_tasks_count = Task::where('assignee_id', $u->id)->where('status', '!=', 'DONE')->count();
                $u->completed_tasks_count = Task::where('assignee_id', $u->id)->where('status', 'DONE')->count();
                $u->active_projects = ProjectMember::where('user_id', $u->id)->with('project')->get()->pluck('project');
                return $u;
            });

        return Inertia::render('projects/team', [
            'users' => $users,
            'rolesList' => $rolesList,
        ]);
    }
}
