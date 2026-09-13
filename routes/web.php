<?php

use App\Http\Controllers\AuditRequestController;
use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MetaCapiController;

use App\Models\Project;

use App\Models\Setting;

Route::get('/', function () {
    $clientProjects = Project::where('is_show_on_home', true)
        ->select('id', 'name', 'client', 'client_logo', 'category', 'status')
        ->latest()
        ->get();

    return Inertia\Inertia::render('welcome', [
        'clientProjects' => $clientProjects,
        'whatsappNumber' => Setting::get('whatsapp_number', '6281234567890'),
        'whatsappDefaultMessage' => Setting::get('whatsapp_default_message', 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing'),
    ]);
})->name('home');

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
        Route::put('{project}', [ProjectBoardController::class, 'updateProject'])->name('update');
        Route::put('{project}/toggle-home-visibility', [ProjectBoardController::class, 'toggleHomeVisibility'])->name('toggleHomeVisibility');
        Route::post('tasks', [ProjectBoardController::class, 'storeTask'])->name('tasks.store');
        Route::put('tasks/{task}/status', [ProjectBoardController::class, 'updateTaskStatus'])->name('tasks.updateStatus');
        Route::post('tasks/{task}/comments', [ProjectBoardController::class, 'storeComment'])->name('tasks.comments.store');
        Route::put('checklists/{checklist}/toggle', [ProjectBoardController::class, 'toggleChecklist'])->name('checklists.toggle');
        Route::post('{project}/credentials', [ProjectCredentialController::class, 'store'])->name('credentials.store');
        Route::put('credentials/{credential}', [ProjectCredentialController::class, 'update'])->name('credentials.update');
        Route::delete('credentials/{credential}', [ProjectCredentialController::class, 'destroy'])->name('credentials.destroy');
        Route::get('timeline', [ProjectTimelineController::class, 'index'])->name('timeline');
        Route::get('team', [ProjectTeamController::class, 'index'])->name('team');
        Route::get('reports', [ProjectReportController::class, 'index'])->name('reports');
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
});


require __DIR__.'/settings.php';

