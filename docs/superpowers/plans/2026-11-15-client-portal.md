# Portal Klien (Tahap 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pengguna berperan `Client` atau `Reviewer` login ke area `/client/*` dengan menu versi klien (Dashboard, Agenda Meeting, Freelancer Hub, Katalog Digital Kreatif) ditambah Shopee dan Meta Analytics, hanya dengan data proyek miliknya.

**Architecture:** Area terpisah `/client/*` dengan controller `App\Http\Controllers\Client\*`, halaman `resources/js/pages/client/*`, dan middleware `client.portal`. Semua kueri lewat satu kelas `ClientScope` yang dibangun di atas `Project::visibleTo`. `ConfineReviewer` diperluas ke `Client` dan tetap tolak-secara-default. Sidebar dipilih di server lewat prop Inertia `portalNav`. Setiap DTO ditulis eksplisit (tanpa `toArray()` model).

**Tech Stack:** Laravel 12 (PHP 8.4), Inertia v3 + React, Pest, Larastan level 7, Pint, Wayfinder, Spatie Permission.

**Spec:** `docs/superpowers/specs/2026-11-15-client-portal-design.md`

## Global Constraints

- Nama rute klien semuanya `client.*`; rute selain itu tetap tertutup bagi `Client`/`Reviewer` (tolak-secara-default lewat `ConfineReviewer::ALLOWED_ROUTES`).
- Peran yang dikenali: `Project::MEMBER_ONLY_ROLES = ['Client', 'Reviewer']`. Satu middleware dan satu pengalaman untuk keduanya.
- Semua halaman klien read-only; satu-satunya "aksi" adalah tautan WhatsApp di Katalog (tanpa tabel baru, tanpa halaman internal tambahan).
- Klien tidak pernah menerima: `freelancer_cost`, margin, tarif/`rate_per_project`, email, telepon, data bank, `access_token`, `portal_url`, `notes` freelancer, `attendees`/`user`/`google_*` rapat, token feed, leads, jumlah pengguna, keuangan.
- Harga klien (`client_price`) tampil di Katalog.
- Data demo: kolom `projects.is_demo`; demo disembunyikan dari beranda publik, `/case-study/*`, dan laporan keuangan (`FinancialReportController` index dan export).
- PHPStan harus tetap 0 temuan (level 7); semua tes lulus; `vendor/bin/pint --test` bersih; `npm run types:check` dan `npm run build` lulus.
- Jangan ubah dependensi. Jangan buat folder dasar baru (subfolder `Client/`, `ClientPortal/` boleh). Jangan buat file dokumentasi selain dokumen ini.
- **Jangan menjalankan `php artisan migrate`, seeder, atau `db:seed` terhadap database default repo ini** (repo berada di `/var/www/genialdigitalsolution.com`, kemungkinan database live). Tes memakai sqlite memori. Untuk memeriksa tampilan secara manual, pakai sqlite sementara: `DB_CONNECTION=sqlite DB_DATABASE=/tmp/claude-portal.sqlite php artisan ...`. Migrasi dan seeder naik bersama deploy yang disetujui pemilik, bukan dari rencana ini.
- Tidak ada deploy dan tidak ada push.
- UI berbahasa Indonesia; ikuti komponen yang ada (`AppLayout`, `@/components/ui/*`).

## Review Focus

- Pengguna `Client`/`Reviewer` tanpa satu pun proyek: keempat halaman klien tetap 200 dengan keadaan kosong, bukan galat. (Task 3, 4, 5, 6, 7)
- `?project_id=` menunjuk proyek klien lain atau tidak ada: diabaikan (tampil semua proyek miliknya), tidak 404 dan tidak membocorkan keberadaannya. (Task 3)
- Proyek demo tetap terlihat oleh akun `Reviewer` yang menjadi anggotanya, tetapi tidak muncul di beranda, case study, dan laporan keuangan. (Task 1, 9)
- Layanan analitik Shopee/Meta melempar galat atau belum terhubung: Dashboard tetap 200 dengan "belum terhubung". (Task 4)
- Freelancer yang ditugaskan di proyek klien A dan proyek klien B: muncul sekali bagi A, dan hitungan kinerjanya hanya dari proyek A. (Task 6)

---

### Task 1: Penanda demo `projects.is_demo` dan penyaringannya

**Files:**
- Create: `database/migrations/2026_11_15_200000_add_is_demo_to_projects_table.php`
- Modify: `app/Models/Project.php` (fillable, casts, scope), `routes/web.php` (rute `home` dan `case-study.show`), `app/Http/Controllers/FinanceFlow/FinancialReportController.php` (kueri `Project::with(['incomes','expenses'])` di `index` dan `export`)
- Test: `tests/Feature/ClientPortal/DemoProjectVisibilityTest.php`

**Interfaces:**
- Produces: kolom `projects.is_demo` (boolean, default `false`); `Project::scopeWithoutDemo(Builder $query): Builder` (dipakai sebagai `Project::withoutDemo()`); `Project` fillable dan cast `is_demo` boolean.

- [ ] **Step 1: Buat cabang kerja**

Run: `git switch -c feat/client-portal` (dari HEAD `feat/shopee-direct-oauth`). Expected: cabang baru aktif, working tree bersih.

- [ ] **Step 2: Tulis tes yang gagal** di `DemoProjectVisibilityTest.php`

Data: satu proyek demo (`is_demo=true`, `is_show_on_home=true`, slug `demo-klien`, ada `Income` dan `Expense` ber-`project_id`) dan satu proyek biasa (`is_show_on_home=true`). Tes:
- `home page lists the normal project but never the demo one`: `get('/')` → Inertia `clientProjects` tidak berisi proyek demo, berisi proyek biasa.
- `case study of a demo project redirects home`: `get('/case-study/demo-klien')` dan `get('/case-study/{id demo}')` → `assertRedirect(route('home'))`; proyek biasa → 200.
- `finance project report excludes demo projects`: Super Admin `get(route('finance.reports.index'))` → Inertia `projectProfitReport` tidak memuat nama proyek demo.
- `finance project csv export excludes demo projects`: `get(route('finance.reports.export', ['type' => 'project']))` → konten tidak berisi nama proyek demo.
- `a demo project is still visible to its member`: `Project::visibleTo($reviewer)` memuatnya.

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/DemoProjectVisibilityTest.php`
Expected: FAIL (kolom `is_demo` belum ada).

- [ ] **Step 4: Implementasi**

Migrasi menambah `boolean('is_demo')->default(false)` (dengan `down()` yang menjatuhkan kolom). Di `Project`: tambah `is_demo` ke `$fillable`, cast `boolean`, dan `scopeWithoutDemo(Builder $query): Builder` → `$query->where('is_demo', false)`. Rute `home`: mulai kueri dari `Project::withoutDemo()`. Rute `case-study.show`: bungkus tiga kondisi lama `slug`/`id`/`client LIKE` dalam satu `where(fn ($q) => ...)` agar `orWhere` tidak lolos dari `withoutDemo()`. `FinancialReportController`: ganti kedua `Project::with(...)` menjadi `Project::withoutDemo()->with(...)`.

- [ ] **Step 5: Jalankan tes, pastikan lulus**

Run: `php artisan test --compact tests/Feature/ClientPortal/DemoProjectVisibilityTest.php tests/Feature/ProjectAccessScopingTest.php`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/migrations app/Models/Project.php routes/web.php app/Http/Controllers/FinanceFlow/FinancialReportController.php tests/Feature/ClientPortal
git commit -m "feat(portal): is_demo flag hides demo projects from home, case study and finance reports"
```

---

### Task 2: Akses `Client`/`Reviewer` ke `/client/*` dan kerangka rute

**Files:**
- Create: `app/Http/Middleware/EnsureClientPortalUser.php`, `app/Http/Controllers/Client/DashboardController.php` (kerangka), `resources/js/pages/client/dashboard.tsx` (kerangka)
- Modify: `app/Http/Middleware/ConfineReviewer.php`, `bootstrap/app.php` (alias `client.portal`), `routes/web.php` (grup `client`), `tests/Feature/ProjectAccessScopingTest.php`
- Test: `tests/Feature/ClientPortal/ClientPortalAccessTest.php`

**Interfaces:**
- Produces: alias middleware `client.portal`; rute `client.dashboard` (`GET /client/dashboard`); `ConfineReviewer::ALLOWED_ROUTES` memuat `client.*`, `profile.edit`, `profile.update`, `security.edit`, `user-password.update`, `appearance.edit` selain daftar Shopee/Meta yang lama (`profile.destroy` tetap tertutup).
- Consumes: `Project::MEMBER_ONLY_ROLES`.

- [ ] **Step 1: Tulis tes yang gagal** di `ClientPortalAccessTest.php`

- `guests are sent to login from the client portal`.
- `staff, admin and super admin get 403 on the client portal` (dataset `Staff`, `Admin`, `Super Admin`).
- `client and reviewer open the client dashboard` (dataset `Client`, `Reviewer`) → 200.
- `client and reviewer are sent to the client dashboard from any internal page`: dataset `/dashboard`, `/projects/board`, `/finance/dashboard`, `/freelancers`, `/meetings`, `/creative-services`, `/content-calendar`, `/users`, `/settings/pixel`, `/settings/whatsapp` → `assertRedirect(route('client.dashboard'))`.
- `client and reviewer may open their own profile and password settings`: `get('/settings/profile')` dan `get(route('security.edit'))` → 200; `DELETE /settings/profile` → 403.
- `login lands a client on the client dashboard`: `get('/dashboard')` sebagai `Client` → redirect ke `client.dashboard`.
- `internal staff are not confined`: `Staff` `get('/dashboard')` → 200.
- `every route named client.* is guarded by client.portal`: iterasi `app('router')->getRoutes()`; untuk tiap rute bernama `client.*`, `in_array('client.portal', $route->gatherMiddleware())`.
- `every other parameterless GET route is closed to clients`: untuk tiap rute GET tanpa parameter di grup `confine.reviewer` yang namanya tidak cocok `ConfineReviewer::ALLOWED_ROUTES`, `Client` mendapat redirect ke `client.dashboard`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientPortalAccessTest.php`
Expected: FAIL.

- [ ] **Step 3: Implementasi**

- `EnsureClientPortalUser::handle(Request $request, Closure $next): Response` → `abort_unless($request->user()?->hasAnyRole(Project::MEMBER_ONLY_ROLES), 403)`; daftarkan alias `client.portal` di `bootstrap/app.php`.
- `ConfineReviewer`: ganti pengecekan `hasRole('Reviewer')` dengan `hasAnyRole(Project::MEMBER_ONLY_ROLES)`; tambahkan pola ke `ALLOWED_ROUTES`; redirect GET non-JSON ke `route('client.dashboard')`; pesan 403: `Akun klien hanya dapat membuka portal klien, analitik Shopee, dan Meta.`; perbarui docblock kelas.
- `routes/web.php`, di dalam grup `auth, verified, confine.reviewer`: `Route::prefix('client')->name('client.')->middleware('client.portal')->group(...)` berisi `Route::get('dashboard', Client\DashboardController::class)->name('dashboard')`.
- `Client\DashboardController::__invoke(Request $request): Response` kerangka → `Inertia::render('client/dashboard', [])`; `client/dashboard.tsx` kerangka yang merender `<AppLayout>` dengan judul "Dashboard".
- Perbarui `ProjectAccessScopingTest.php`: dataset "a reviewer is sent to the shopee page…" kini menuju `route('client.dashboard')` dan tidak lagi memuat `profile`; ganti nama tes menjadi `…sent to the client dashboard instead of anything else`; tes "the client role keeps its existing access outside the analytics pages" dibalik: `Client` di `/projects/board` kini di-redirect ke `client.dashboard` (ubah nama tes sesuai).

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `php artisan test --compact tests/Feature/ClientPortal tests/Feature/ProjectAccessScopingTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app bootstrap routes resources/js/pages/client tests
git commit -m "feat(portal): client portal access, confine clients by default, client.dashboard skeleton"
```

---

### Task 3: `ClientScope` (satu-satunya pintu data proyek klien)

**Files:**
- Create: `app/Services/ClientPortal/ClientScope.php`
- Test: `tests/Feature/ClientPortal/ClientScopeTest.php`

**Interfaces:**
- Produces: `final class ClientScope` dengan
  - `public static function for(Request $request): self` (membaca `project_id` dari query string; `abort(403)` bila pengguna bukan `Client`/`Reviewer`)
  - `public function projects(): Collection` (`Collection<int, Project>` berisi hanya kolom `id, name, client, status, progress`, urut `name`)
  - `public function selectedProjectId(): ?int` (filter yang valid, atau `null` = semua)
  - `public function projectIds(): array` (`list<int>`; `[selected]` bila ada filter valid, selain itu semua proyek anggota)
  - `public function allProjectIds(): array` (`list<int>`, mengabaikan filter)

- [ ] **Step 1: Tulis tes yang gagal** di `ClientScopeTest.php`

Pakai dua proyek (milik pengguna dan milik klien lain) dengan helper `Request::create('/x', 'GET', ['project_id' => ...])` ber-`setUserResolver`.
- `projects only contains the user's projects with safe columns`.
- `a valid project_id narrows projectIds and sets selectedProjectId`.
- `a project_id of another client is ignored, not rejected`: `selectedProjectId() === null`, `projectIds()` = semua milik sendiri.
- `a non-numeric or unknown project_id is ignored`.
- `a member without projects gets empty projects and ids`.
- `staff are refused`: `ClientScope::for($staffRequest)` melempar `HttpException` 403.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientScopeTest.php`
Expected: FAIL (kelas belum ada).

- [ ] **Step 3: Implementasi**

Konstruktor privat menerima `User` dan `?int $requestedProjectId`. `projects()` memakai `Project::visibleTo($user)->select([...])->orderBy('name')->get()` dan menyimpan hasilnya. `selectedProjectId()` mengembalikan id yang diminta hanya bila ada di `projects()`.

- [ ] **Step 4: Jalankan tes, lalu PHPStan pada berkas baru**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientScopeTest.php && vendor/bin/phpstan analyse app/Services/ClientPortal --memory-limit=1G`
Expected: PASS, 0 temuan.

- [ ] **Step 5: Commit**

```bash
git add app/Services/ClientPortal tests/Feature/ClientPortal/ClientScopeTest.php
git commit -m "feat(portal): ClientScope limits every client query to member projects"
```

---

### Task 4: Dashboard klien

**Files:**
- Create: `app/Services/ClientPortal/ClientPerformanceSummary.php`
- Modify: `app/Http/Controllers/Client/DashboardController.php`, `resources/js/pages/client/dashboard.tsx`
- Test: `tests/Feature/ClientPortal/ClientDashboardTest.php`

**Interfaces:**
- Consumes: `ClientScope::for()`, `ShopeeAnalyticsSource::report(ShopeePeriod, CarbonImmutable, ?Project)`, `MetaAdsAnalyticsSource::report(MetaAdsPeriod, CarbonImmutable, ?Project)`.
- Produces: `ClientPerformanceSummary::forProject(Project $project): array{shopee: array{isConnected: bool, revenue: int|float|null, orders: int|null, roas: float|null}, meta: array{isConnected: bool, spend: int|null, revenue: int|null, roas: float|null, purchases: int|null}}`, di-cache 300 detik per proyek (`client-portal.performance.{id}`), periode 30 hari, berakhir kemarin. Nilai Shopee diambil dari item `summary.kpis` ber-`key` `revenue`, `orders`, `roas`; nilai Meta dari `summary.totals`. Galat (`Throwable`) menjadi `isConnected: false` dengan nilai `null` dan dicatat `Log::warning`.
- Produces props halaman `client/dashboard`: `projects` (`list<{id,name,client,status,progress}>`), `selectedProjectId` (`?int`), `upcomingMeetings` (`list<{id,title,start_time,end_time,platform,meeting_link,project_name}>`, maks 5, `start_time >= now()`, `status != 'cancelled'`, urut naik, hanya `projectIds()`), `performance` (hasil `forProject` untuk proyek terpilih atau proyek pertama; `null` bila tanpa proyek).

- [ ] **Step 1: Tulis tes yang gagal** di `ClientDashboardTest.php`

Ikat `ShopeeAnalyticsSource` dan `MetaAdsAnalyticsSource` ke fake lewat `app()->instance(...)` (satu fake mengembalikan laporan terhubung dengan `summary.kpis`/`summary.totals`, satu fake melempar `RuntimeException`).
- `dashboard shows only the member's projects and upcoming meetings`.
- `meetings of another project never appear`.
- `cancelled and past meetings are not upcoming`.
- `performance comes from the connected sources`: `performance.shopee.revenue` dan `performance.meta.spend` sesuai fake.
- `a failing analytics source yields isConnected false and still 200`.
- `the performance summary is cached for five minutes`: panggil dua kali, fake dipanggil sekali.
- `a member without projects sees an empty dashboard`: 200, `projects` kosong, `performance` `null`.
- `nothing internal is exposed`: konten respons tidak memuat `leads`, `totalUsers`, `canAccessFinance: true`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientDashboardTest.php`
Expected: FAIL.

- [ ] **Step 3: Implementasi backend** (`DashboardController::__invoke`, `ClientPerformanceSummary`) sesuai kontrak di atas.

- [ ] **Step 4: Implementasi halaman** `client/dashboard.tsx`: kartu proyek (nama, status, bar progres), filter proyek (`Select` memakai `router.get` dengan `project_id`), ringkasan performa Shopee/Meta ("Belum terhubung" bila `isConnected` false), daftar rapat terdekat, dan tautan ke menu lain yang memakai `portalNav` dari `usePage().props` (lihat Task 8) bila tersedia. Keadaan kosong: "Belum ada proyek yang ditautkan ke akun Anda."

- [ ] **Step 5: Jalankan tes dan pemeriksaan tipe**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientDashboardTest.php && npm run types:check`
Expected: PASS, tanpa galat tipe.

- [ ] **Step 6: Commit**

```bash
git add app resources/js/pages/client tests
git commit -m "feat(portal): client dashboard with project summary, meetings and cached performance"
```

---

### Task 5: Agenda Meeting klien (dan ekstraksi ICS bersama)

**Files:**
- Create: `app/Services/MeetingIcs.php`, `app/Http/Controllers/Client/MeetingController.php`, `resources/js/pages/client/meetings.tsx`
- Modify: `app/Http/Controllers/MeetingController.php` (`downloadIcs` memakai `MeetingIcs`), `routes/web.php`
- Test: `tests/Feature/ClientPortal/ClientMeetingsTest.php`

**Interfaces:**
- Produces: `MeetingIcs::render(Meeting $meeting): string` (isi `.ics` persis seperti `MeetingController::downloadIcs` sekarang); rute `client.meetings.index` (`GET /client/meetings`) dan `client.meetings.ics` (`GET /client/meetings/{meeting}/ics`, mengembalikan unduhan `meeting-{id}.ics`, `404` bila `meeting.project_id` bukan anggota `allProjectIds()`).
- Props `client/meetings`: `meetings` (`list<{id,title,description,start_time,end_time,platform,meeting_link,location,status,project_name}>`, urut `start_time` naik, hanya `projectIds()`), `projects`, `selectedProjectId`.
- Consumes: `ClientScope`.

- [ ] **Step 1: Tulis tes yang gagal** di `ClientMeetingsTest.php`

- `lists only meetings of the member's projects`; rapat tanpa `project_id` tidak tampil.
- `a project filter narrows the list`.
- `attendees, creator and google fields never reach the client`: buat rapat dengan `attendees` berisi email, `user_id`, `google_event_id`; konten respons tidak memuat nilai-nilai itu.
- `a client downloads the ics of their own meeting` → 200, `text/calendar`, memuat `BEGIN:VEVENT` dan judul.
- `the ics of another client's meeting is 404`.
- `member without projects sees an empty list`.
- `staff download-ics output is unchanged after extraction`: `MeetingController` internal `downloadIcs` → 200 dengan `UID:genial-meeting-{id}@` dan `SUMMARY:`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientMeetingsTest.php`
Expected: FAIL.

- [ ] **Step 3: Implementasi**: pindahkan pembentukan isi `.ics` ke `MeetingIcs::render` (tanpa mengubah keluarannya) dan panggil dari kedua controller; DTO rapat ditulis eksplisit; halaman `client/meetings.tsx` mengikuti tata letak `pages/meetings/index.tsx` versi daftar saja (tanpa form, tanpa Google, tanpa feed), dengan tombol "Unduh ICS" ke `client.meetings.ics`.

- [ ] **Step 4: Jalankan tes**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientMeetingsTest.php tests/Feature/MeetingCalendarFeedTest.php && npm run types:check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app resources/js/pages/client routes tests
git commit -m "feat(portal): client meeting agenda with per-meeting ICS download"
```

---

### Task 6: Freelancer Hub klien

**Files:**
- Create: `app/Http/Controllers/Client/FreelancerController.php`, `resources/js/pages/client/freelancers.tsx`
- Modify: `routes/web.php`
- Test: `tests/Feature/ClientPortal/ClientFreelancersTest.php`

**Interfaces:**
- Produces: rute `client.freelancers.index` (`GET /client/freelancers`). Props: `freelancers` (`list<{id,name,initials,skill,portfolio_link,stats:{completed:int,active:int,total:int}}>`, hanya freelancer berstatus `active` yang punya penugasan di `projectIds()`, urut `name`), `projects`, `selectedProjectId`.
- Aturan statistik: hanya penugasan dengan `project_id` di `projectIds()`; `completed` = status `completed`; `active` = status `assigned`, `in_progress`, `submitted`, `revision`; `total` = semuanya. `skill` = kolom `role`. `initials` = huruf pertama dua kata pertama nama, kapital.

- [ ] **Step 1: Tulis tes yang gagal** di `ClientFreelancersTest.php`

- `shows only freelancers assigned to the member's projects`.
- `a freelancer with assignments on two clients appears once and counts only this client's projects` (Review Focus).
- `inactive freelancers are hidden`.
- `private data never reaches the client`: freelancer dengan `email`, `phone`, `rate_per_project`, `bank_account_number`, `access_token`, `notes`; konten respons tidak memuat satu pun nilainya dan tidak memuat `portal_url`.
- `initials and skill are derived`: "Alina Putri" → `AP`; `role` → `skill`.
- `member without projects sees an empty list`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientFreelancersTest.php`
Expected: FAIL.

- [ ] **Step 3: Implementasi**: `Freelancer::query()->where('status','active')->whereHas('assignments', fn ($q) => $q->whereIn('project_id', $ids))` dengan tiga `withCount` ber-kondisi yang sama; DTO eksplisit. Halaman: kartu dengan avatar inisial (komponen `Avatar` di `@/components/ui` bila ada), keahlian, tautan portofolio (`target="_blank" rel="noreferrer"`), dan tiga angka kinerja.

- [ ] **Step 4: Jalankan tes dan tipe**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientFreelancersTest.php && npm run types:check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app resources/js/pages/client routes tests
git commit -m "feat(portal): client freelancer hub with explicit safe DTO"
```

---

### Task 7: Katalog Digital Kreatif klien

**Files:**
- Create: `app/Http/Controllers/Client/CreativeServiceController.php`, `resources/js/pages/client/catalog.tsx`
- Modify: `routes/web.php`
- Test: `tests/Feature/ClientPortal/ClientCatalogTest.php`

**Interfaces:**
- Produces: rute `client.catalog.index` (`GET /client/catalog`). Props: `services` (`list<{id,name,category,format,description,deliverables,client_price:float,unit,turnaround_days:int|null}>`, hanya `is_active`, urut `sort_order` lalu `name`), `whatsappNumber` (`Setting::get('whatsapp_number', '6281234567890')`).
- Tautan "ajukan" dibangun di React: `https://wa.me/{whatsappNumber}?text=` + `encodeURIComponent('Halo Genial Digital Solution, saya tertarik dengan layanan "' + name + '"')`.

- [ ] **Step 1: Tulis tes yang gagal** di `ClientCatalogTest.php`

- `lists active services with their client price`: `services.0.client_price === 350000.0`.
- `inactive services are hidden`.
- `freelancer cost and margin never reach the client`: konten respons tidak memuat `freelancer_cost`, `estimated_margin`, `is_active`, `sort_order`.
- `exposes the whatsapp number from settings`, dan default `6281234567890` bila belum diatur.
- `an empty catalog is a normal page`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientCatalogTest.php`
Expected: FAIL.

- [ ] **Step 3: Implementasi** controller (DTO eksplisit; `client_price` di-cast `(float)`) dan halaman: kartu per layanan dikelompokkan per `category`, harga dengan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`, tombol "Ajukan lewat WhatsApp" membuka tautan di tab baru (`rel="noreferrer"`).

- [ ] **Step 4: Jalankan tes dan tipe**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientCatalogTest.php && npm run types:check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app resources/js/pages/client routes tests
git commit -m "feat(portal): client catalog shows client price and requests via WhatsApp"
```

---

### Task 8: Sidebar klien dari server (`portalNav`)

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`, `resources/js/types/global.d.ts`, `resources/js/components/app-sidebar.tsx`, `resources/js/components/user-menu-content.tsx` dan `resources/js/layouts/settings/layout.tsx` (sembunyikan entri Pixel dan WhatsApp bila `portalNav` ada; periksa isi berkas dulu)
- Test: `tests/Feature/ClientPortal/ClientSidebarTest.php`

**Interfaces:**
- Produces: prop bersama `portalNav: null | list<{key: 'dashboard'|'meetings'|'freelancers'|'catalog'|'shopee'|'meta-ads', title: string, href: string}>`. `null` untuk peran selain `Client`/`Reviewer`. Urutan dan judul tetap: Dashboard (`client.dashboard`), Agenda Meeting (`client.meetings.index`), Freelancer Hub (`client.freelancers.index`), Katalog Digital Kreatif (`client.catalog.index`), Shopee Analytics (`shopee.index`), Meta Ads Analytics (`meta-ads.index`); `href` berupa path relatif (`route(..., absolute: false)`).

- [ ] **Step 1: Tulis tes yang gagal** di `ClientSidebarTest.php`

- `client and reviewer get exactly the six client menus in order` (dataset kedua peran; pada `client.dashboard`, `shopee.index`, `meta-ads.index`): `portalNav` berisi enam `key` berurutan dan `href` yang benar.
- `no portalNav item points to an internal route`: setiap `href` cocok dengan salah satu pola `ConfineReviewer::ALLOWED_ROUTES` (cari lewat `app('router')->getRoutes()->match(...)` atau cocokkan nama rute).
- `staff and admins get null`: dataset `Staff`, `Admin`, `Super Admin` pada `/dashboard`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientSidebarTest.php`
Expected: FAIL.

- [ ] **Step 3: Implementasi**: `HandleInertiaRequests::share` menambah `'portalNav' => $this->portalNav($request)` (metode privat, mengembalikan `null` untuk non-anggota-saja). `global.d.ts`: tambah `portalNav` pada `PageProps`. `app-sidebar.tsx`: bila `portalNav` ada, `NavMain` menerima item dari `portalNav` dengan peta ikon `{dashboard: LayoutGrid, meetings: CalendarCheck, freelancers: Briefcase, catalog: Palette, shopee: ShoppingBag, 'meta-ads': Share2}` dan tautan logo menuju `portalNav[0].href`; bila `null`, perilaku lama tidak berubah.

- [ ] **Step 4: Jalankan tes, tipe, dan build**

Run: `php artisan test --compact tests/Feature/ClientPortal && npm run types:check && npm run build`
Expected: PASS; build selesai tanpa galat.

- [ ] **Step 5: Commit**

```bash
git add app resources/js tests
git commit -m "feat(portal): server-driven client sidebar via portalNav shared prop"
```

---

### Task 9: Pemeriksaan Shopee/Meta untuk klien dan seeder demo

**Files:**
- Create: `database/seeders/ClientPortalDemoSeeder.php`
- Test: `tests/Feature/ClientPortal/ClientAnalyticsExposureTest.php`, `tests/Feature/ClientPortal/ClientPortalDemoSeederTest.php`

**Interfaces:**
- Produces: `ClientPortalDemoSeeder::run(): void`, idempoten. Membuat/memperbarui (kunci `slug`/judul/nama, tanpa duplikat): proyek `slug = 'demo-portal-klien'` (`name` "Demo Portal Klien", `client` "Klien Demo", `status` "In Progress", `progress` 40, `is_demo` true, `is_show_on_home` false, tanggal mulai/selesai ±30 hari); dua rapat mendatang ber-`project_id` itu; dua freelancer ber-nama diawali "[Demo] " dengan email `@example.invalid`, masing-masing satu `FreelancerAssignment` ber-`fee_amount` 0 (satu `completed`, satu `in_progress`, `payment_status` `unpaid`); dua `CreativeService` ber-nama diawali "[Demo] " hanya bila belum ada layanan aktif; semua pengguna ber-peran `Reviewer` ditautkan sebagai `ProjectMember` (`role` `Member`) lewat `firstOrCreate`. Tidak dipanggil dari `DatabaseSeeder`.

- [ ] **Step 1: Tulis tes pemaparan** di `ClientAnalyticsExposureTest.php` (karakterisasi; harus lulus tanpa perubahan kode bila model sudah menyembunyikan rahasia)

Untuk `Client` dan `Reviewer`, `get(route('shopee.index'))` dan `get(route('meta-ads.index'))`:
- `no token or secret keys appear`: konten tidak memuat `access_token`, `refresh_token`, `partner_key`, `app_secret` (nilai maupun nama kunci); sediakan `ProjectShopeeConfig` dan `ProjectMetaConfig` ber-token untuk proyek miliknya.
- `other clients' project names never appear`.
- `shopeeApp.canManageCredentials is false and metaApp.can_setup is false`.
- `the client sidebar is used on these pages`: `portalNav` berisi enam item.
Jika salah satu gagal, perbaiki dengan DTO/penyaringan di controller terkait, bukan dengan mengubah halaman internal.

- [ ] **Step 2: Tulis tes seeder** di `ClientPortalDemoSeederTest.php`

- `seeding twice creates no duplicates` (hitungan `Project`, `Meeting`, `Freelancer`, `FreelancerAssignment`, `ProjectMember`, `CreativeService` sama setelah dua kali `run`).
- `the demo project is flagged and hidden from home` (`is_demo` true; `/` tidak memuatnya).
- `every reviewer becomes a member and sees the demo data on all four pages`: `client.dashboard`, `client.meetings.index`, `client.freelancers.index`, `client.catalog.index` → 200 dengan data tidak kosong.
- `demo assignments carry no money`: `FreelancerAssignment::sum('fee_amount') == 0` untuk penugasan demo.
- `services are only created when the catalog has no active service`.

- [ ] **Step 3: Jalankan, pastikan seeder gagal dan pemaparan lulus atau diperbaiki**

Run: `php artisan test --compact tests/Feature/ClientPortal/ClientAnalyticsExposureTest.php tests/Feature/ClientPortal/ClientPortalDemoSeederTest.php`
Expected: tes seeder FAIL (kelas belum ada).

- [ ] **Step 4: Implementasi seeder** sesuai kontrak di atas.

- [ ] **Step 5: Jalankan tes**

Run: `php artisan test --compact tests/Feature/ClientPortal`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/seeders tests
git commit -m "feat(portal): idempotent demo seeder and exposure checks for shopee/meta pages"
```

---

### Task 10: Verifikasi akhir (tanpa deploy)

**Files:** tidak ada perubahan kode kecuali perbaikan dari temuan.

- [ ] **Step 1: Seluruh tes dan analisis statis**

Run: `php artisan test --compact && vendor/bin/phpstan analyse --memory-limit=1G && vendor/bin/pint --test`
Expected: semua tes lulus (jumlah awal 416 ditambah tes baru), PHPStan 0 temuan, Pint bersih.

- [ ] **Step 2: Front-end**

Run: `npm run types:check && npm run check && npm run build`
Expected: tanpa galat.

- [ ] **Step 3: Jalan-jalan manual pada database sementara** (skill `run`)

Run: `DB_CONNECTION=sqlite DB_DATABASE=/tmp/claude-portal.sqlite php artisan migrate --force && DB_CONNECTION=sqlite DB_DATABASE=/tmp/claude-portal.sqlite php artisan db:seed --class=ClientPortalDemoSeeder --force`, buat satu pengguna `Reviewer` di database sementara itu sebelum menjalankan seeder, lalu login dan buka keempat halaman klien, Shopee, dan Meta. Expected: sidebar enam menu, tidak ada tautan yang mengarah ke halaman internal, tidak ada galat konsol. Hapus `/tmp/claude-portal.sqlite` setelahnya.

- [ ] **Step 4: Laporkan** ke pemilik: hasil tiap perintah di atas, daftar berkas berubah, dan langkah deploy yang menunggu persetujuan (migrasi `is_demo`, lalu `php artisan db:seed --class=ClientPortalDemoSeeder --force`). Jangan deploy.
