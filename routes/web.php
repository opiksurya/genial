<?php

use App\Http\Controllers\AuditRequestController;
use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MetaCapiController;

use App\Models\Project;

use App\Models\Setting;

Route::get('/', function () {
    $clientProjects = Project::where('is_show_on_home', true)
        ->select('id', 'name', 'client', 'client_logo', 'slug', 'category', 'status', 'article_title', 'growth_percentage')
        ->latest()
        ->get()
        ->unique('client')
        ->values();

    return Inertia\Inertia::render('welcome', [
        'clientProjects' => $clientProjects,
        'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        'whatsappDefaultMessage' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing'),
    ]);
})->name('home');

Route::get('/case-study/{slug}', function ($slug) {
    $project = Project::where('slug', $slug)
        ->orWhere('id', is_numeric($slug) ? $slug : 0)
        ->orWhere('client', 'LIKE', '%' . str_replace('-', ' ', $slug) . '%')
        ->first();

    if (!$project) {
        return redirect()->route('home');
    }

    return Inertia\Inertia::render('case-study', [
        'project' => $project,
        'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        'whatsappDefaultMessage' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya tertarik dengan studi kasus ' . ($project->client ?? 'brand') . ' dan ingin berdiskusi lebih lanjut'),
    ]);
})->name('case-study.show');

Route::get('/activation', function () {
    return Inertia\Inertia::render('activation', [
        'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        'whatsappDefaultMessage' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi mengenai alur aktivasi kerjasama digital marketing'),
    ]);
})->name('activation');

Route::get('/how-we-work', function () {
    return Inertia\Inertia::render('how-we-work', [
        'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        'whatsappDefaultMessage' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi mengenai Skema Metode & Funnel Strategy digital marketing'),
    ]);
})->name('how-we-work');

Route::get('/support', function () {
    return Inertia\Inertia::render('support', [
        'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        'whatsappDefaultMessage' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi mengenai Penunjang Bisnis (Digital Creative & Sistem ERP)'),
    ]);
})->name('support');

Route::get('/our-story', function () {
    return Inertia\Inertia::render('our-story', [
        'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        'whatsappDefaultMessage' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya tertarik dengan cerita & filosofi Genial dan ingin berdiskusi lebih lanjut'),
    ]);
})->name('our-story');

Route::post('/audit-request', [AuditRequestController::class, 'store'])->name('audit.request');

Route::post('/api/meta-capi/track', [MetaCapiController::class, 'track'])->name('meta.capi.track');

// Google OAuth Login Routes
Route::get('/auth/google', [GoogleController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback'])->name('auth.google.callback');

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectFlow\ProjectDashboardController;
use App\Http\Controllers\ProjectFlow\ProjectBoardController;
use App\Http\Controllers\ProjectFlow\ProjectTimelineController;
use App\Http\Controllers\ProjectFlow\ProjectTeamController;
use App\Http\Controllers\ProjectFlow\ProjectReportController;
use App\Http\Controllers\ProjectFlow\ProjectCredentialController;
use App\Http\Controllers\FinanceFlow\FinanceDashboardController;
use App\Http\Controllers\FinanceFlow\IncomeController;
use App\Http\Controllers\FinanceFlow\ExpenseController;
use App\Http\Controllers\FinanceFlow\AllocationController;
use App\Http\Controllers\FinanceFlow\FinancialReportController;
use App\Http\Controllers\FinanceFlow\FinanceSettingController;

use App\Http\Controllers\AgentPortalController;
use App\Http\Controllers\FinanceFlow\AgentController;

Route::get('/agent/portal/{access_token}', [AgentPortalController::class, 'index'])->name('agent.portal');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);

    // Genial ProjectFlow Module Routes
    Route::prefix('projects')->name('projects.')->group(function () {
        Route::get('dashboard', [ProjectDashboardController::class, 'index'])->name('dashboard');
        Route::get('board', [ProjectBoardController::class, 'index'])->name('board');
        Route::post('store', [ProjectBoardController::class, 'storeProject'])->name('store');
        
        // Tasks & Checklists
        Route::post('tasks', [ProjectBoardController::class, 'storeTask'])->name('tasks.store');
        Route::put('tasks/{task}', [ProjectBoardController::class, 'updateTask'])->name('tasks.update');
        Route::delete('tasks/{task}', [ProjectBoardController::class, 'destroyTask'])->name('tasks.destroy');
        Route::put('tasks/{task}/status', [ProjectBoardController::class, 'updateTaskStatus'])->name('tasks.updateStatus');
        Route::post('tasks/{task}/comments', [ProjectBoardController::class, 'storeComment'])->name('tasks.comments.store');
        Route::put('checklists/{checklist}/toggle', [ProjectBoardController::class, 'toggleChecklist'])->name('checklists.toggle');
        
        // Credentials
        Route::put('credentials/{credential}', [ProjectCredentialController::class, 'update'])->name('credentials.update');
        Route::delete('credentials/{credential}', [ProjectCredentialController::class, 'destroy'])->name('credentials.destroy');
        
        // Navigation / Views
        Route::get('timeline', [ProjectTimelineController::class, 'index'])->name('timeline');
        Route::get('team', [ProjectTeamController::class, 'index'])->name('team');
        Route::get('reports', [ProjectReportController::class, 'index'])->name('reports');
        Route::post('upload-article-image', [ProjectBoardController::class, 'uploadArticleImage'])->name('article.upload-image');

        // Parameterized Project Routes
        Route::match(['put', 'post'], '{project}', [ProjectBoardController::class, 'updateProject'])->whereNumber('project')->name('update');
        Route::put('{project}/toggle-home-visibility', [ProjectBoardController::class, 'toggleHomeVisibility'])->whereNumber('project')->name('toggleHomeVisibility');
        Route::post('{project}/credentials', [ProjectCredentialController::class, 'store'])->whereNumber('project')->name('credentials.store');
        Route::get('{project}/article', [ProjectBoardController::class, 'editArticle'])->whereNumber('project')->name('article.edit');
        Route::post('{project}/article', [ProjectBoardController::class, 'updateArticle'])->whereNumber('project')->name('article.update');
    });

    // Genial FinanceFlow Module Routes
    Route::prefix('finance')->name('finance.')->group(function () {
        Route::get('dashboard', [FinanceDashboardController::class, 'index'])->name('dashboard');
        
        Route::get('income', [IncomeController::class, 'index'])->name('income.index');
        Route::post('income', [IncomeController::class, 'store'])->name('income.store');
        Route::put('income/{income}', [IncomeController::class, 'update'])->name('income.update');
        Route::delete('income/{income}', [IncomeController::class, 'destroy'])->name('income.destroy');
        
        Route::get('expense', [ExpenseController::class, 'index'])->name('expense.index');
        Route::post('expense', [ExpenseController::class, 'store'])->name('expense.store');
        Route::put('expense/{expense}', [ExpenseController::class, 'update'])->name('expense.update');
        Route::put('expense/{expense}/approve', [ExpenseController::class, 'approve'])->name('expense.approve');
        Route::delete('expense/{expense}', [ExpenseController::class, 'destroy'])->name('expense.destroy');
        
        Route::get('allocation', [AllocationController::class, 'index'])->name('allocation.index');
        Route::post('allocation', [AllocationController::class, 'store'])->name('allocation.store');
        Route::put('allocation/{allocation}', [AllocationController::class, 'update'])->name('allocation.update');
        Route::post('allocation/{allocation}/sub', [AllocationController::class, 'storeSub'])->name('allocation.storeSub');
        Route::delete('allocation/{allocation}', [AllocationController::class, 'destroy'])->name('allocation.destroy');

        Route::get('agents', [AgentController::class, 'index'])->name('agents.index');
        Route::post('agents', [AgentController::class, 'store'])->name('agents.store');
        Route::put('agents/{agent}', [AgentController::class, 'update'])->name('agents.update');
        Route::delete('agents/{agent}', [AgentController::class, 'destroy'])->name('agents.destroy');
        Route::post('agents/{agent}/regenerate-token', [AgentController::class, 'regenerateToken'])->name('agents.regenerateToken');
        Route::put('agent-commissions/{commission}/pay', [AgentController::class, 'payCommission'])->name('agents.payCommission');
        
        Route::get('reports', [FinancialReportController::class, 'index'])->name('reports.index');
        Route::get('reports/export', [FinancialReportController::class, 'export'])->name('reports.export');
        
        Route::get('settings', [FinanceSettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [FinanceSettingController::class, 'store'])->name('settings.store');
    });

    // Kalender Konten (AI) Module Routes
    Route::prefix('content-calendar')->name('content-calendar.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ContentCalendarController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\ContentCalendarController::class, 'store'])->name('store');
        Route::put('/{contentPlan}', [\App\Http\Controllers\ContentCalendarController::class, 'update'])->name('update');
        Route::delete('/{contentPlan}', [\App\Http\Controllers\ContentCalendarController::class, 'destroy'])->name('destroy');
        Route::post('/generate-ai', [\App\Http\Controllers\ContentCalendarController::class, 'generateAi'])->name('generate');
        Route::post('/refine-ai', [\App\Http\Controllers\ContentCalendarController::class, 'refineAi'])->name('refine');
        Route::post('/settings', [\App\Http\Controllers\ContentCalendarController::class, 'saveSettings'])->name('settings');
        Route::post('/clear-month', [\App\Http\Controllers\ContentCalendarController::class, 'clearMonth'])->name('clear-month');
    });
});


require __DIR__.'/settings.php';

