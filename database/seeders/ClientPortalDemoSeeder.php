<?php

namespace Database\Seeders;

use App\Models\CreativeService;
use App\Models\Freelancer;
use App\Models\FreelancerAssignment;
use App\Models\Meeting;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo data for the client portal (reviewer walkthroughs). Idempotent and
 * deliberately not called from DatabaseSeeder; run it explicitly.
 */
class ClientPortalDemoSeeder extends Seeder
{
    public function run(): void
    {
        $team = $this->seedTeam();

        $project = Project::updateOrCreate(
            ['slug' => 'demo-portal-klien'],
            [
                'name' => 'Demo Portal Klien',
                'client' => 'Klien Demo',
                'status' => 'In Progress',
                'progress' => 40,
                'is_demo' => true,
                'is_show_on_home' => false,
                'manager_id' => $team['manager']->id,
                'start_date' => now()->subDays(30)->toDateString(),
                'end_date' => now()->addDays(30)->toDateString(),
            ],
        );

        $this->seedMeetings($project);
        $this->seedProjectFlow($project, $team);
        $this->seedFreelancers($project);
        $this->seedServices();
        $this->linkReviewers($project);
    }

    /**
     * Fictional internal team for the demo project. These accounts have no role and
     * a random password nobody knows, so they can never be used to log in.
     *
     * @return array{manager: User, designer: User, ads: User}
     */
    private function seedTeam(): array
    {
        $make = function (string $name, string $email): User {
            $user = User::where('email', $email)->first();

            if ($user === null) {
                $user = new User;
                $user->forceFill(['name' => $name, 'email' => $email, 'password' => Str::random(48)])->save();
            }

            return $user;
        };

        return [
            'manager' => $make('[Demo] Sari Project Manager', 'demo-sari@example.invalid'),
            'designer' => $make('[Demo] Rina Desainer Tim', 'demo-rina-tim@example.invalid'),
            'ads' => $make('[Demo] Dimas Ads Specialist', 'demo-dimas@example.invalid'),
        ];
    }

    /**
     * @param  array{manager: User, designer: User, ads: User}  $team
     */
    private function seedProjectFlow(Project $project, array $team): void
    {
        foreach ([
            [$team['manager'], 'Project Manager'],
            [$team['designer'], 'Designer'],
            [$team['ads'], 'Ads Specialist'],
        ] as [$user, $role]) {
            ProjectMember::updateOrCreate(
                ['project_id' => $project->id, 'user_id' => $user->id],
                ['role' => $role],
            );
        }

        $tasks = [
            ['[Demo] Riset kompetitor dan audiens', 'DONE', 'High', $team['manager'], -25, -18],
            ['[Demo] Susun strategi kampanye', 'DONE', 'High', $team['manager'], -20, -12],
            ['[Demo] Desain banner promo', 'REVIEW', 'Medium', $team['designer'], -8, 2],
            ['[Demo] Setup iklan Shopee dan Meta', 'IN_PROGRESS', 'High', $team['ads'], -5, 6],
            ['[Demo] Produksi video iklan 15 detik', 'IN_PROGRESS', 'Medium', $team['designer'], -3, 9],
            ['[Demo] Optimasi budget iklan mingguan', 'PLANNING', 'Medium', $team['ads'], 5, 14],
            ['[Demo] Laporan performa bulanan', 'BACKLOG', 'Low', $team['manager'], 15, 25],
            ['[Demo] Tinjauan hasil kampanye', 'BACKLOG', 'Low', $team['manager'], 20, 28],
        ];

        foreach ($tasks as $order => [$title, $status, $priority, $assignee, $startOffset, $dueOffset]) {
            Task::updateOrCreate(
                ['project_id' => $project->id, 'title' => $title],
                [
                    'status' => $status,
                    'priority' => $priority,
                    'assignee_id' => $assignee->id,
                    'start_date' => now()->addDays($startOffset)->toDateString(),
                    'due_date' => now()->addDays($dueOffset)->toDateString(),
                    'order' => $order,
                ],
            );
        }

        foreach ([
            ['[Demo] Strategi disetujui', -12, true],
            ['[Demo] Materi kreatif siap tayang', 3, false],
            ['[Demo] Evaluasi akhir kampanye', 28, false],
        ] as [$title, $dueOffset, $completed]) {
            Milestone::updateOrCreate(
                ['project_id' => $project->id, 'title' => $title],
                ['due_date' => now()->addDays($dueOffset)->toDateString(), 'is_completed' => $completed],
            );
        }
    }

    private function seedMeetings(Project $project): void
    {
        $meetings = [
            ['title' => '[Demo] Kickoff Kampanye', 'days' => 2, 'description' => 'Pembahasan target dan jadwal kampanye.'],
            ['title' => '[Demo] Review Performa Iklan', 'days' => 7, 'description' => 'Tinjauan hasil iklan dan rencana optimasi.'],
        ];

        foreach ($meetings as $item) {
            $start = now()->addDays($item['days'])->setTime(10, 0);

            Meeting::updateOrCreate(
                ['project_id' => $project->id, 'title' => $item['title']],
                [
                    'description' => $item['description'],
                    'start_time' => $start,
                    'end_time' => $start->copy()->addHour(),
                    'platform' => 'google_meet',
                    'status' => 'scheduled',
                ],
            );
        }
    }

    private function seedFreelancers(Project $project): void
    {
        $items = [
            ['name' => '[Demo] Rina Desainer', 'email' => 'demo-rina@example.invalid', 'role' => 'Desainer Grafis', 'title' => '[Demo] Set Banner Promo', 'status' => 'completed'],
            ['name' => '[Demo] Budi Videografer', 'email' => 'demo-budi@example.invalid', 'role' => 'Video Editor', 'title' => '[Demo] Video Iklan 15 Detik', 'status' => 'in_progress'],
        ];

        foreach ($items as $item) {
            $freelancer = Freelancer::firstOrCreate(
                ['email' => $item['email']],
                ['name' => $item['name'], 'role' => $item['role'], 'status' => 'active'],
            );

            FreelancerAssignment::updateOrCreate(
                ['freelancer_id' => $freelancer->id, 'project_id' => $project->id, 'title' => $item['title']],
                [
                    'fee_amount' => 0,
                    'status' => $item['status'],
                    'payment_status' => 'unpaid',
                    'deadline' => now()->addDays(14)->toDateString(),
                ],
            );
        }
    }

    private function seedServices(): void
    {
        // Never pollute a real catalog: demo services only fill an empty one.
        if (CreativeService::where('is_active', true)->exists()) {
            return;
        }

        $services = [
            ['name' => '[Demo] Desain Poster Promo', 'category' => 'Desain', 'format' => 'JPG', 'unit' => 'per desain', 'price' => 350000, 'days' => 3],
            ['name' => '[Demo] Video Iklan Pendek', 'category' => 'Video', 'format' => 'MP4', 'unit' => 'per video', 'price' => 750000, 'days' => 5],
        ];

        foreach ($services as $index => $item) {
            CreativeService::firstOrCreate(
                ['name' => $item['name']],
                [
                    'category' => $item['category'],
                    'format' => $item['format'],
                    'description' => 'Contoh layanan untuk demo katalog.',
                    'deliverables' => '1 file siap pakai',
                    'client_price' => $item['price'],
                    'freelancer_cost' => 0,
                    'unit' => $item['unit'],
                    'turnaround_days' => $item['days'],
                    'is_active' => true,
                    'sort_order' => $index,
                ],
            );
        }
    }

    private function linkReviewers(Project $project): void
    {
        foreach (User::role('Reviewer')->get() as $user) {
            ProjectMember::firstOrCreate(
                ['project_id' => $project->id, 'user_id' => $user->id],
                ['role' => 'Member'],
            );
        }
    }
}
