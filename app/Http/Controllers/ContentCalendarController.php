<?php

namespace App\Http\Controllers;

use App\Models\ContentPlan;
use App\Models\Project;
use App\Models\Setting;
use App\Services\ContentCalendarAiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContentCalendarController extends Controller
{
    public function __construct(
        protected ContentCalendarAiService $aiService
    ) {}

    /**
     * Display the content calendar page.
     */
    public function index(Request $request): Response
    {
        $currentDate = Carbon::now();
        $month = (int) $request->input('month', $currentDate->month);
        $year = (int) $request->input('year', $currentDate->year);
        $platform = $request->input('platform', 'all');
        $status = $request->input('status', 'all');
        $projectId = $request->input('project_id');

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->format('Y-m-d');

        $query = ContentPlan::query()
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->orderBy('scheduled_date')
            ->orderBy('scheduled_time');

        if ($platform && $platform !== 'all') {
            $query->where('platform', $platform);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        $items = $query->with(['freelancer', 'project'])->get();

        // Check if there are no items in the database at all for this month,
        // and if it's the first time viewing (e.g. July 2026 or current month), we can seed initial realistic data or leave empty.
        if ($items->isEmpty() && $request->boolean('seed_demo', false)) {
            $targetDates = [];
            $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $targetDates[] = Carbon::createFromDate($year, $month, $d)->format('Y-m-d');
            }
            $defaultItems = $this->aiService->generateDefaultFallbackCalendar(
                $targetDates,
                'Hoof ID',
                'Pabrik Konveksi & Sablon Garmen',
                ['TikTok', 'Shopee Video', 'Instagram Reels'],
                ['Product Showcase', 'Edukasi', 'Behind The Scene', 'Promo', 'Testimonial']
            );

            foreach ($defaultItems as $item) {
                ContentPlan::create(array_merge($item, [
                    'user_id' => $request->user()?->id,
                    'brand_name' => 'Hoof ID',
                ]));
            }

            $items = ContentPlan::with(['freelancer', 'project'])
                ->whereBetween('scheduled_date', [$startDate, $endDate])
                ->orderBy('scheduled_date')
                ->get();
        }

        $projects = Project::select('id', 'name', 'client')->orderBy('name')->get();
        $freelancers = \App\Models\Freelancer::where('status', 'active')
            ->select('id', 'name', 'role', 'rate_per_project', 'bank_name', 'bank_account_number')
            ->orderBy('name')
            ->get();

        $aiSettings = [
            'default_provider' => Setting::get('ai_default_provider', 'gemini'),
            'gemini_api_key_set' => !empty(Setting::get('gemini_api_key', env('GEMINI_API_KEY'))),
            'claude_api_key_set' => !empty(Setting::get('claude_api_key', env('CLAUDE_API_KEY', env('ANTHROPIC_API_KEY')))),
            'openai_api_key_set' => !empty(Setting::get('openai_api_key', env('OPENAI_API_KEY'))),
            'openrouter_api_key_set' => !empty(Setting::get('openrouter_api_key', env('OPENROUTER_API_KEY'))),
            'gemini_model' => Setting::get('gemini_model', 'gemini-2.0-flash'),
            'claude_model' => Setting::get('claude_model', 'claude-3-5-sonnet-20241022'),
            'openai_model' => Setting::get('openai_model', 'gpt-4o-mini'),
        ];

        // Overall stats for the month
        $stats = [
            'total' => ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->count(),
            'draft' => ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->where('status', 'Draft')->count(),
            'in_progress' => ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->where('status', 'In Progress')->count(),
            'revisi' => ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->whereIn('status', ['Revisi', 'Revision'])->count(),
            'scheduled' => ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->where('status', 'Scheduled')->count(),
            'published' => ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->where('status', 'Published')->count(),
        ];

        return Inertia::render('content-calendar/index', [
            'items' => $items,
            'currentMonth' => $month,
            'currentYear' => $year,
            'currentPlatform' => $platform,
            'currentStatus' => $status,
            'currentProjectId' => $projectId,
            'projects' => $projects,
            'freelancers' => $freelancers,
            'aiSettings' => $aiSettings,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created content plan item.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'nullable|string',
            'platform' => 'required|string',
            'format' => 'required|string',
            'pillar' => 'required|string',
            'status' => 'required|string',
            'reference_link' => 'nullable|string',
            'submission_link' => 'nullable|string',
            'freelancer_notes' => 'nullable|string',
            'visual_detail' => 'nullable|string',
            'wording' => 'nullable|string',
            'copywriting' => 'nullable|string',
            'hashtags' => 'nullable|string',
            'notes' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'brand_name' => 'nullable|string|max:255',
            'freelancer_id' => 'nullable|exists:freelancers,id',
            'freelancer_fee' => 'nullable|numeric|min:0',
            'freelancer_status' => 'nullable|string',
            'payout_status' => 'nullable|string',
        ]);

        $validated['user_id'] = $request->user()?->id;

        if (!empty($validated['freelancer_id'])) {
            $validated['freelancer_status'] = $validated['freelancer_status'] ?? 'assigned';
            if (empty($validated['freelancer_fee'])) {
                $fl = \App\Models\Freelancer::find($validated['freelancer_id']);
                $validated['freelancer_fee'] = $fl?->rate_per_project ?? 0;
            }
        }

        ContentPlan::create($validated);

        return back()->with('success', 'Konten berhasil ditambahkan ke kalender.');
    }

    /**
     * Update the specified content plan item.
     */
    public function update(Request $request, ContentPlan $contentPlan): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'nullable|string',
            'platform' => 'required|string',
            'format' => 'required|string',
            'pillar' => 'required|string',
            'status' => 'required|string',
            'reference_link' => 'nullable|string',
            'submission_link' => 'nullable|string',
            'freelancer_notes' => 'nullable|string',
            'visual_detail' => 'nullable|string',
            'wording' => 'nullable|string',
            'copywriting' => 'nullable|string',
            'hashtags' => 'nullable|string',
            'notes' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'brand_name' => 'nullable|string|max:255',
            'freelancer_id' => 'nullable|exists:freelancers,id',
            'freelancer_fee' => 'nullable|numeric|min:0',
            'freelancer_status' => 'nullable|string',
            'payout_status' => 'nullable|string',
        ]);

        if (!empty($validated['freelancer_id']) && (empty($contentPlan->freelancer_id) || $contentPlan->freelancer_status === 'unassigned')) {
            $validated['freelancer_status'] = $validated['freelancer_status'] ?? 'assigned';
        }

        $contentPlan->update($validated);

        return back()->with('success', 'Perubahan konten berhasil disimpan.');
    }

    /**
     * Admin ACC / Approve freelancer work on a content plan item.
     */
    public function approveFreelancerWork(Request $request, ContentPlan $contentPlan): RedirectResponse
    {
        $contentPlan->update([
            'freelancer_status' => 'approved',
            'payout_status' => 'approved', // ACC by Admin, ready for payout!
            'status' => 'Scheduled', // Move content to Scheduled
        ]);

        return back()->with('success', "Hasil kerja freelancer untuk konten \"{$contentPlan->title}\" berhasil di-ACC (Disetujui)! Upah siap dicairkan.");
    }

    /**
     * Admin Payout / Bayar Upah Freelancer for a content plan.
     */
    public function payFreelancerFee(Request $request, ContentPlan $contentPlan): RedirectResponse
    {
        $status = $request->input('status', 'paid');
        $recordExpense = (bool) $request->input('record_expense', true);

        $contentPlan->update([
            'payout_status' => $status,
            'paid_at' => $status === 'paid' ? now() : null,
        ]);

        // Auto record into Expense in FinanceFlow if requested, paid, and has fee
        if ($status === 'paid' && $recordExpense && !$contentPlan->expense_id && $contentPlan->freelancer_fee > 0) {
            $flName = $contentPlan->freelancer?->name ?? 'Freelancer';
            $expense = \App\Models\Expense::create([
                'project_id' => $contentPlan->project_id,
                'name' => "[Freelancer] Konten: {$contentPlan->title} ({$flName})",
                'category' => 'Freelancer',
                'amount' => $contentPlan->freelancer_fee,
                'date' => now()->toDateString(),
                'status' => 'Approved',
                'description' => "Pencairan upah konten kalender \"{$contentPlan->title}\" ({$contentPlan->platform} - {$contentPlan->format}) kepada {$flName}",
                'created_by' => auth()->id(),
            ]);

            $contentPlan->update(['expense_id' => $expense->id]);
        }

        $textStatus = $status === 'paid' ? 'LUNAS (Paid)' : 'Belum Lunas';
        return back()->with('success', "Upah freelancer Rp " . number_format($contentPlan->freelancer_fee, 0, ',', '.') . " diubah menjadi {$textStatus}!");
    }

    /**
     * Remove the specified content plan item.
     */
    public function destroy(ContentPlan $contentPlan): RedirectResponse
    {
        $contentPlan->delete();

        return back()->with('success', 'Konten berhasil dihapus.');
    }

    /**
     * Generate content calendar plan with AI.
     */
    public function generateAi(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2035',
            'brand_name' => 'nullable|string|max:255',
            'niche' => 'nullable|string|max:255',
            'project_id' => 'nullable|exists:projects,id',
            'platforms' => 'required|array',
            'platforms.*' => 'string',
            'frequency' => 'required|string|in:daily,weekdays,3x_week',
            'pillars' => 'nullable|array',
            'tone' => 'nullable|string',
            'custom_prompt' => 'nullable|string',
            'provider' => 'nullable|string',
            'model' => 'nullable|string',
            'api_key' => 'nullable|string',
            'replace_existing' => 'nullable|boolean',
        ]);

        $month = (int) $validated['month'];
        $year = (int) $validated['year'];
        $replaceExisting = $request->boolean('replace_existing', true);

        // Optionally clear existing items if user selected replace
        if ($replaceExisting) {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->format('Y-m-d');
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->format('Y-m-d');
            ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->delete();
        }

        // Call AI Service
        $generatedItems = $this->aiService->generateCalendar($validated);

        // Save generated items
        $userId = $request->user()?->id;
        $projectId = $validated['project_id'] ?? null;
        $brandName = $validated['brand_name'] ?? 'Hoof ID';

        foreach ($generatedItems as $item) {
            ContentPlan::create([
                'user_id' => $userId,
                'project_id' => $projectId,
                'brand_name' => $brandName,
                'title' => $item['title'] ?? 'Konten Sosial Media',
                'scheduled_date' => $item['scheduled_date'],
                'scheduled_time' => $item['scheduled_time'] ?? '19:00',
                'platform' => $item['platform'] ?? 'TikTok',
                'format' => $item['format'] ?? 'Video',
                'pillar' => $item['pillar'] ?? 'Product Showcase',
                'status' => $item['status'] ?? 'Draft',
                'reference_link' => $item['reference_link'] ?? null,
                'visual_detail' => $item['visual_detail'] ?? null,
                'wording' => $item['wording'] ?? null,
                'copywriting' => $item['copywriting'] ?? null,
                'hashtags' => $item['hashtags'] ?? null,
            ]);
        }

        return redirect()->route('content-calendar.index', [
            'month' => $month,
            'year' => $year,
        ])->with('success', 'Kalender Konten berhasil digenerate oleh AI (' . count($generatedItems) . ' konten dibuat)!');
    }

    /**
     * Refine single content item with AI.
     */
    public function refineAi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'platform' => 'required|string',
            'format' => 'required|string',
            'pillar' => 'required|string',
            'visual_detail' => 'nullable|string',
            'wording' => 'nullable|string',
            'copywriting' => 'nullable|string',
            'hashtags' => 'nullable|string',
            'instruction' => 'required|string',
            'provider' => 'nullable|string',
            'api_key' => 'nullable|string',
        ]);

        $refined = $this->aiService->refineContentItem(
            $validated,
            $validated['instruction'],
            $validated['provider'] ?? null,
            $validated['api_key'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => $refined,
        ]);
    }

    /**
     * Save AI settings (API keys and default provider).
     */
    public function saveSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'default_provider' => 'required|string|in:gemini,claude,openai,openrouter',
            'gemini_api_key' => 'nullable|string',
            'claude_api_key' => 'nullable|string',
            'openai_api_key' => 'nullable|string',
            'openrouter_api_key' => 'nullable|string',
            'gemini_model' => 'nullable|string',
            'claude_model' => 'nullable|string',
            'openai_model' => 'nullable|string',
        ]);

        Setting::set('ai_default_provider', $validated['default_provider']);

        if (!empty($validated['gemini_api_key'])) {
            Setting::set('gemini_api_key', $validated['gemini_api_key']);
        }
        if (!empty($validated['claude_api_key'])) {
            Setting::set('claude_api_key', $validated['claude_api_key']);
        }
        if (!empty($validated['openai_api_key'])) {
            Setting::set('openai_api_key', $validated['openai_api_key']);
        }
        if (!empty($validated['openrouter_api_key'])) {
            Setting::set('openrouter_api_key', $validated['openrouter_api_key']);
        }

        if (!empty($validated['gemini_model'])) {
            Setting::set('gemini_model', $validated['gemini_model']);
        }
        if (!empty($validated['claude_model'])) {
            Setting::set('claude_model', $validated['claude_model']);
        }
        if (!empty($validated['openai_model'])) {
            Setting::set('openai_model', $validated['openai_model']);
        }

        return back()->with('success', 'Pengaturan API AI berhasil disimpan.');
    }

    /**
     * Clear all content plans in a month.
     */
    public function clearMonth(Request $request): RedirectResponse
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->format('Y-m-d');

        ContentPlan::whereBetween('scheduled_date', [$startDate, $endDate])->delete();

        return back()->with('success', 'Semua konten pada bulan ini berhasil dibersihkan.');
    }
}
