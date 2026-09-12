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
    }
}

