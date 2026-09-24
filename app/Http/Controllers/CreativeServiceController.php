<?php

namespace App\Http\Controllers;

use App\Models\CreativeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CreativeServiceController extends Controller
{
    /**
     * Display the Creative Services & Rate Card Catalog.
     */
    public function index(Request $request): Response
    {
        $category = $request->input('category', 'all');
        $search = $request->input('search', '');
        $format = $request->input('format', 'all');

        $query = CreativeService::query()->orderBy('sort_order')->orderBy('name');

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($format && $format !== 'all') {
            $query->where('format', $format);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('deliverables', 'ILIKE', "%{$search}%");
            });
        }

        $services = $query->get();

        // Get all unique categories & formats for filter pills
        $allServices = CreativeService::all();
        $categories = $allServices->pluck('category')->unique()->values();
        $formats = $allServices->pluck('format')->unique()->values();

        // Summary statistics
        $stats = [
            'total_components' => $allServices->count(),
            'active_components' => $allServices->where('is_active', true)->count(),
            'video_components' => $allServices->where('format', 'Video')->count(),
            'design_components' => $allServices->whereIn('format', ['Image', 'Carousel'])->count(),
            'average_margin' => $allServices->count() > 0 
                ? round($allServices->avg(fn ($s) => $s->estimated_margin), 1) 
                : 0,
            'total_categories' => $categories->count(),
        ];

        return Inertia::render('creative-services/index', [
            'services' => $services,
            'allServices' => $allServices->where('is_active', true)->values(),
            'categories' => $categories,
            'formats' => $formats,
            'currentCategory' => $category,
            'currentFormat' => $format,
            'search' => $search,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created creative service component.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'format' => 'required|string|max:50',
            'description' => 'nullable|string',
            'deliverables' => 'nullable|string',
            'client_price' => 'required|numeric|min:0',
            'freelancer_cost' => 'required|numeric|min:0',
            'unit' => 'required|string|max:100',
            'turnaround_days' => 'required|integer|min:1|max:90',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        CreativeService::create([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Komponen kreatif berhasil ditambahkan ke database.');
    }

    /**
     * Update an existing creative service component.
     */
    public function update(Request $request, CreativeService $creativeService): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'format' => 'required|string|max:50',
            'description' => 'nullable|string',
            'deliverables' => 'nullable|string',
            'client_price' => 'required|numeric|min:0',
            'freelancer_cost' => 'required|numeric|min:0',
            'unit' => 'required|string|max:100',
            'turnaround_days' => 'required|integer|min:1|max:90',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $creativeService->update([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $validated['sort_order'] ?? $creativeService->sort_order,
        ]);

        return redirect()->back()->with('success', 'Komponen kreatif berhasil diperbarui.');
    }

    /**
     * Toggle the active status of a service component.
     */
    public function toggleActive(CreativeService $creativeService): RedirectResponse
    {
        $creativeService->update([
            'is_active' => !$creativeService->is_active,
        ]);

        $status = $creativeService->is_active ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "Komponen kreatif berhasil {$status}.");
    }

    /**
     * Remove the specified creative service.
     */
    public function destroy(CreativeService $creativeService): RedirectResponse
    {
        $creativeService->delete();

        return redirect()->back()->with('success', 'Komponen kreatif berhasil dihapus dari database.');
    }

    /**
     * API JSON list of active services for quick lookups & calculators.
     */
    public function apiList(): JsonResponse
    {
        $services = CreativeService::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }
}
