<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'manage users',
            'view leads',
            'delete leads',
            'manage settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        $staffRole = Role::firstOrCreate(['name' => 'Staff']);
        $clientRole = Role::firstOrCreate(['name' => 'Client']);

        // Assign permissions to roles
        $superAdminRole->syncPermissions(Permission::all());
        $adminRole->syncPermissions(['manage users', 'view leads', 'manage settings']);
        $staffRole->syncPermissions(['view leads']);

        // Create or update Super Admin user
        $user = User::updateOrCreate(
            ['email' => 'superadmin@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        $user->assignRole($superAdminRole);

        // Seed Default Settings
        if (!\App\Models\Setting::find('whatsapp_number')) {
            \App\Models\Setting::set('whatsapp_number', '6281234567890');
        }
        if (!\App\Models\Setting::find('whatsapp_default_message')) {
            \App\Models\Setting::set('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing');
        }
        if (!\App\Models\Setting::find('ga4_id')) {
            \App\Models\Setting::set('ga4_id', 'G-YRNS0SP4P7');
        }
        if (!\App\Models\Setting::find('ga4_enabled')) {
            \App\Models\Setting::set('ga4_enabled', '1');
        }


        // ProjectFlow initialized clean without dummy data

        // Seed Sample FinanceFlow Data if empty
        if (\App\Models\Income::count() === 0) {
            $p1 = \App\Models\Project::first();
            
            // Incomes
            $inc3 = \App\Models\Income::create([
                'client_name' => 'Kuliner Nusantara',
                'name' => 'SEO Monthly Retainer',
                'amount' => 10000000,
                'date' => now()->subDays(10),
                'status' => 'paid',
                'invoice_number' => 'INV-2026-003',
                'notes' => 'Retainer SEO bulanan & konten artikel.',
                'created_by' => $user->id,
            ]);

            $inc4 = \App\Models\Income::create([
                'client_name' => 'Fashion Hijab Brand',
                'name' => 'Marketplace Campaign',
                'amount' => 8000000,
                'date' => now()->subDays(12),
                'status' => 'partial',
                'invoice_number' => 'INV-2026-004',
                'notes' => 'Optimasi toko Shopee & Tokopedia.',
                'created_by' => $user->id,
            ]);

            $exp4 = \App\Models\Expense::create([
                'category' => 'Software Subscription',
                'name' => 'Ahrefs & Semrush Monthly Sub',
                'description' => 'Langganan tool analisis SEO agency.',
                'amount' => 3000000,
                'date' => now()->subDays(7),
                'approval_status' => 'approved',
                'approved_by' => $user->id,
                'created_by' => $user->id,
            ]);

            $exp5 = \App\Models\Expense::create([
                'category' => 'Operational',
                'name' => 'Sewa Office & Internet Fiber',
                'description' => 'Biaya operasional kantor & bandwidth 100Mbps.',
                'amount' => 4000000,
                'date' => now()->subDays(15),
                'approval_status' => 'approved',
                'approved_by' => $user->id,
                'created_by' => $user->id,
            ]);

            // Allocations (Default: Real Money = 53M Income - 15M Expense = 38M)
            $totalRealMoney = 38000000;

            $alloc1 = \App\Models\Allocation::create([
                'name' => 'Company Profit',
                'percentage' => 40,
                'amount' => (40 / 100) * $totalRealMoney,
                'sort_order' => 1,
                'created_by' => $user->id,
            ]);

            $alloc2 = \App\Models\Allocation::create([
                'name' => 'Marketing Budget',
                'percentage' => 30,
                'amount' => (30 / 100) * $totalRealMoney,
                'sort_order' => 2,
                'created_by' => $user->id,
            ]);

            $alloc3 = \App\Models\Allocation::create([
                'name' => 'Team Reward',
                'percentage' => 20,
                'amount' => (20 / 100) * $totalRealMoney,
                'sort_order' => 3,
                'created_by' => $user->id,
            ]);

            $alloc4 = \App\Models\Allocation::create([
                'name' => 'Reserve Fund',
                'percentage' => 10,
                'amount' => (10 / 100) * $totalRealMoney,
                'sort_order' => 4,
                'created_by' => $user->id,
            ]);

            // Sub-Allocations for Team Reward (20% of Real Money = 7,600,000)
            $teamAllocAmount = (20 / 100) * $totalRealMoney;
            
            \App\Models\SubAllocation::create([
                'allocation_id' => $alloc3->id,
                'name' => 'Designer',
                'percentage' => 30,
                'amount' => (30 / 100) * $teamAllocAmount,
                'sort_order' => 1,
            ]);

            \App\Models\SubAllocation::create([
                'allocation_id' => $alloc3->id,
                'name' => 'Developer',
                'percentage' => 40,
                'amount' => (40 / 100) * $teamAllocAmount,
                'sort_order' => 2,
            ]);

            \App\Models\SubAllocation::create([
                'allocation_id' => $alloc3->id,
                'name' => 'Project Manager',
                'percentage' => 20,
                'amount' => (20 / 100) * $teamAllocAmount,
                'sort_order' => 3,
            ]);

            \App\Models\SubAllocation::create([
                'allocation_id' => $alloc3->id,
                'name' => 'Bonus',
                'percentage' => 10,
                'amount' => (10 / 100) * $teamAllocAmount,
                'sort_order' => 4,
            ]);



            \App\Models\FinancialTransaction::create([
                'type' => 'allocation',
                'reference_type' => \App\Models\Allocation::class,
                'reference_id' => $alloc3->id,
                'activity_name' => 'Configured Team Reward Sub-Allocation (Designer 30%, Dev 40%, PM 20%, Bonus 10%)',
                'user_id' => $user->id,
                'amount' => $teamAllocAmount,
                'status' => 'completed',
            ]);
        }

        $this->call(CaseStudySeeder::class);

        // Seed Freelancers & Assignments
        if (\App\Models\Freelancer::count() === 0) {
            $fl1 = \App\Models\Freelancer::create([
                'name' => 'Dimas Bagas Nugraha',
                'role' => 'Video Editor & Reels',
                'email' => 'dimas.editor@gmail.com',
                'phone' => '081234567891',
                'portfolio_link' => 'https://drive.google.com',
                'rate_per_project' => 150000,
                'rate_unit' => 'per_content',
                'bank_name' => 'BCA',
                'bank_account_number' => '8210928371',
                'bank_account_name' => 'Dimas Bagas Nugraha',
                'access_token' => \Illuminate\Support\Str::random(48),
                'status' => 'active',
                'notes' => 'Spesialis CapCut, Premiere Pro, color grading Reels & TikTok hook dinamis.',
            ]);

            $fl2 = \App\Models\Freelancer::create([
                'name' => 'Alina Putri',
                'role' => 'Graphic Designer & Canva',
                'email' => 'alina.creative@gmail.com',
                'phone' => '085712349876',
                'portfolio_link' => 'https://behance.net',
                'rate_per_project' => 100000,
                'rate_unit' => 'per_content',
                'bank_name' => 'Mandiri',
                'bank_account_number' => '1370019283746',
                'bank_account_name' => 'Alina Putri',
                'access_token' => \Illuminate\Support\Str::random(48),
                'status' => 'active',
                'notes' => 'Desain feed carousel, banner promo, thumbnail viral.',
            ]);

            $fl3 = \App\Models\Freelancer::create([
                'name' => 'Reza Fahmi',
                'role' => 'Voice Over & Talent',
                'email' => 'reza.vo@gmail.com',
                'phone' => '081398765432',
                'rate_per_project' => 75000,
                'rate_unit' => 'per_content',
                'bank_name' => 'BCA',
                'bank_account_number' => '7120938472',
                'bank_account_name' => 'Reza Fahmi',
                'access_token' => \Illuminate\Support\Str::random(48),
                'status' => 'active',
                'notes' => 'Suara kasual, ramah, energik untuk iklan TikTok & Shopee Video.',
            ]);

            $sampleProject = \App\Models\Project::first();

            \App\Models\FreelancerAssignment::create([
                'freelancer_id' => $fl1->id,
                'project_id' => $sampleProject?->id,
                'title' => 'Edit 5 Video TikTok Batch Promo September',
                'description' => 'Edit footage konveksi kaos dengan dynamic text, sound trend TikTok, dan hook 3 detik pertama.',
                'brief_link' => 'https://drive.google.com',
                'submission_link' => 'https://drive.google.com/file/sample',
                'fee_amount' => 750000,
                'deadline' => now()->addDays(3)->toDateString(),
                'status' => 'submitted',
                'payment_status' => 'unpaid',
            ]);

            \App\Models\FreelancerAssignment::create([
                'freelancer_id' => $fl2->id,
                'project_id' => $sampleProject?->id,
                'title' => 'Desain 3 Carousel Edukasi Bahan Sablon',
                'description' => 'Desain infografis perbandingan kain combed 24s vs 30s untuk Instagram Feed.',
                'brief_link' => 'https://figma.com',
                'fee_amount' => 300000,
                'deadline' => now()->addDays(5)->toDateString(),
                'status' => 'in_progress',
                'payment_status' => 'unpaid',
            ]);
        }
    }
}

