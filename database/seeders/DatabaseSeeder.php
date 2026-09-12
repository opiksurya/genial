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


        // Seed Sample ProjectFlow Data if empty

        if (\App\Models\Project::count() === 0) {
            $p1 = \App\Models\Project::create([
                'name' => 'Website E-Commerce Development',
                'client' => 'BatikKu Indonesia',
                'client_logo' => 'https://ui-avatars.com/api/?name=BatikKu+Indonesia&background=2D90CA&color=fff&size=128',
                'description' => 'Pengembangan website toko online batik premium dengan payment gateway & ekspedisi otomatis.',
                'category' => 'Website Development',
                'status' => 'In Progress',
                'priority' => 'High',
                'progress' => 60,
                'start_date' => now()->startOfMonth(),
                'end_date' => now()->endOfMonth(),
                'manager_id' => $user->id,
            ]);


            \App\Models\ProjectMember::create(['project_id' => $p1->id, 'user_id' => $user->id, 'role' => 'Project Manager']);

            $t1 = \App\Models\Task::create([
                'project_id' => $p1->id,
                'title' => 'Wireframing & UI/UX Design Figma',
                'description' => 'Membuat mockup 12 halaman utama desktop dan mobile responsive.',
                'status' => 'DONE',
                'priority' => 'High',
                'label' => 'Design',
                'assignee_id' => $user->id,
                'assignee_role' => 'Designer',
                'start_date' => now()->startOfMonth(),
                'due_date' => now()->startOfMonth()->addDays(7),
                'order' => 1,
            ]);

            $t2 = \App\Models\Task::create([
                'project_id' => $p1->id,
                'title' => 'Setup Laravel & Database Schema PostgreSQL',
                'description' => 'Konfigurasi backend, relasi produk, varian, cart, dan checkout API.',
                'status' => 'IN_PROGRESS',
                'priority' => 'Urgent',
                'label' => 'Backend',
                'assignee_id' => $user->id,
                'assignee_role' => 'Developer',
                'start_date' => now()->startOfMonth()->addDays(8),
                'due_date' => now()->startOfMonth()->addDays(18),
                'order' => 2,
            ]);

            $t3 = \App\Models\Task::create([
                'project_id' => $p1->id,
                'title' => 'Integrasi Payment Gateway Midtrans & Ongkir API',
                'description' => 'Sistem checkout otomatis VA, QRIS, dan cek ongkir RajaOngkir.',
                'status' => 'PLANNING',
                'priority' => 'High',
                'label' => 'API Integration',
                'assignee_id' => $user->id,
                'assignee_role' => 'Developer',
                'start_date' => now()->startOfMonth()->addDays(19),
                'due_date' => now()->endOfMonth(),
                'order' => 3,
            ]);

            \App\Models\TaskDependency::create([
                'task_id' => $t2->id,
                'depends_on_task_id' => $t1->id,
            ]);

            \App\Models\Milestone::create([
                'project_id' => $p1->id,
                'title' => 'Soft Launching Beta Version',
                'due_date' => now()->startOfMonth()->addDays(20),
                'is_completed' => false,
            ]);

            $p2 = \App\Models\Project::create([
                'name' => 'SEO Optimization & Organic Growth',
                'client' => 'Skincare Glowing ID',
                'client_logo' => 'https://ui-avatars.com/api/?name=Skincare+Glowing&background=FAD03D&color=000&size=128',
                'description' => 'Audit SEO on-page, strategi kata kunci commercial intent, & backlink outreach.',
                'category' => 'SEO Campaign',
                'status' => 'Planning',
                'priority' => 'Medium',
                'progress' => 20,
                'start_date' => now()->startOfMonth()->addDays(5),
                'end_date' => now()->addMonth()->endOfMonth(),
                'manager_id' => $user->id,
            ]);


            \App\Models\Task::create([
                'project_id' => $p2->id,
                'title' => 'Technical Audit & Core Web Vitals Optimization',
                'description' => 'Perbaiki speed lighthous, mobile usability, & structured data schema markup.',
                'status' => 'IN_PROGRESS',
                'priority' => 'High',
                'label' => 'SEO Technical',
                'assignee_id' => $user->id,
                'assignee_role' => 'SEO Specialist',
                'start_date' => now()->startOfMonth()->addDays(5),
                'due_date' => now()->startOfMonth()->addDays(15),
                'order' => 1,
            ]);

            // Seed Sample Project Credentials
            \App\Models\ProjectCredential::create([
                'project_id' => $p1->id,
                'platform' => 'Shopee',
                'title' => 'Official Store Shopee BatikKu',
                'username_email' => 'shopee_batikku_official',
                'password' => 'ShopeeBatik123!',
                'url_link' => 'https://seller.shopee.co.id',
                'notes' => 'OTP via WhatsApp Admin CS 081234567890',
                'created_by' => $user->id,
            ]);

            \App\Models\ProjectCredential::create([
                'project_id' => $p1->id,
                'platform' => 'Meta Ads',
                'title' => 'Business Manager Meta Ads',
                'username_email' => 'ads@batikku.co.id',
                'password' => 'MetaAds2026Secure#',
                'url_link' => 'https://business.facebook.com',
                'notes' => 'Pixel ID: 8871239912 | BM ID: 90212384',
                'created_by' => $user->id,
            ]);

            \App\Models\ProjectCredential::create([
                'project_id' => $p1->id,
                'platform' => 'Website / cPanel',
                'title' => 'cPanel Hosting Server Utama',
                'username_email' => 'admin_batikku',
                'password' => 'NiagaHoster!2026Pass',
                'url_link' => 'https://cpanel.batikku.co.id:2083',
                'notes' => 'DB Name: batikku_prod, DB User: batikku_user',
                'created_by' => $user->id,
            ]);

            \App\Models\ProjectCredential::create([
                'project_id' => $p2->id,
                'platform' => 'TikTok Ads',
                'title' => 'TikTok Ads Manager Official',
                'username_email' => 'ads.skincareglowing@gmail.com',
                'password' => 'TikTokAds#2026Val',
                'url_link' => 'https://ads.tiktok.com',
                'notes' => 'Business Center ID: 7781293812',
                'created_by' => $user->id,
            ]);

            \App\Models\ProjectCredential::create([
                'project_id' => $p2->id,
                'platform' => 'Google Ads',
                'title' => 'Google Ads & Search Console',
                'username_email' => 'seo.skincareglowing@gmail.com',
                'password' => 'GoogleSEO2026!',
                'url_link' => 'https://ads.google.com',
                'notes' => 'Customer ID: 412-990-1283',
                'created_by' => $user->id,
            ]);

            $p1->recalculateProgress();
            $p2->recalculateProgress();
        }

        // Seed Sample FinanceFlow Data if empty
        if (\App\Models\Income::count() === 0) {
            $p1 = \App\Models\Project::first();
            
            // Incomes
            $inc1 = \App\Models\Income::create([
                'project_id' => $p1 ? $p1->id : null,
                'client_name' => 'BatikKu Indonesia',
                'name' => 'Client Website Project',
                'amount' => 20000000,
                'date' => now()->startOfMonth(),
                'status' => 'paid',
                'invoice_number' => 'INV-2026-001',
                'notes' => 'Pembayaran lunas termin 1 website e-commerce BatikKu.',
                'created_by' => $user->id,
            ]);

            $inc2 = \App\Models\Income::create([
                'client_name' => 'Skincare Glowing ID',
                'name' => 'Google Ads Management',
                'amount' => 15000000,
                'date' => now()->subDays(5),
                'status' => 'paid',
                'invoice_number' => 'INV-2026-002',
                'notes' => 'Setup & Management fee Google Ads & Meta Ads campaign.',
                'created_by' => $user->id,
            ]);

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

            // Expenses
            $exp1 = \App\Models\Expense::create([
                'income_id' => $inc1->id,
                'project_id' => $p1 ? $p1->id : null,
                'category' => 'Ads Budget',
                'name' => 'Meta Ads & Google Ads Budget',
                'description' => 'Top up saldo iklan Meta & Google Ads client.',
                'amount' => 5000000,
                'date' => now()->startOfMonth()->addDays(2),
                'approval_status' => 'approved',
                'approved_by' => $user->id,
                'created_by' => $user->id,
            ]);

            $exp2 = \App\Models\Expense::create([
                'income_id' => $inc1->id,
                'project_id' => $p1 ? $p1->id : null,
                'category' => 'Tools',
                'name' => 'Plugin Licensing & Tools',
                'description' => 'Lisensi WP Rocket, Elementor Pro, & hosting server premium.',
                'amount' => 1000000,
                'date' => now()->startOfMonth()->addDays(3),
                'approval_status' => 'approved',
                'approved_by' => $user->id,
                'created_by' => $user->id,
            ]);

            $exp3 = \App\Models\Expense::create([
                'income_id' => $inc1->id,
                'project_id' => $p1 ? $p1->id : null,
                'category' => 'Freelancer',
                'name' => 'UI/UX Freelance Designer Fee',
                'description' => 'Jasa pengerjaan Figma mockup 12 halaman.',
                'amount' => 2000000,
                'date' => now()->startOfMonth()->addDays(4),
                'approval_status' => 'approved',
                'approved_by' => $user->id,
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

            // Financial Transactions Activity Log
            \App\Models\FinancialTransaction::create([
                'type' => 'income',
                'reference_type' => \App\Models\Income::class,
                'reference_id' => $inc1->id,
                'activity_name' => 'Added Income: Client Website Project',
                'user_id' => $user->id,
                'amount' => 20000000,
                'status' => 'completed',
            ]);

            \App\Models\FinancialTransaction::create([
                'type' => 'expense',
                'reference_type' => \App\Models\Expense::class,
                'reference_id' => $exp1->id,
                'activity_name' => 'Added Expense: [Ads Budget] Meta Ads & Google Ads Budget',
                'user_id' => $user->id,
                'amount' => 5000000,
                'status' => 'completed',
            ]);

            \App\Models\FinancialTransaction::create([
                'type' => 'expense',
                'reference_type' => \App\Models\Expense::class,
                'reference_id' => $exp2->id,
                'activity_name' => 'Added Expense: [Tools] Plugin Licensing & Tools',
                'user_id' => $user->id,
                'amount' => 1000000,
                'status' => 'completed',
            ]);

            \App\Models\FinancialTransaction::create([
                'type' => 'expense',
                'reference_type' => \App\Models\Expense::class,
                'reference_id' => $exp3->id,
                'activity_name' => 'Added Expense: [Freelancer] UI/UX Freelance Designer Fee',
                'user_id' => $user->id,
                'amount' => 2000000,
                'status' => 'completed',
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
    }
}

