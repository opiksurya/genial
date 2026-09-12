<?php

use App\Http\Controllers\AuditRequestController;
use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MetaCapiController;

Route::inertia('/', 'welcome')->name('home');
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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);

    // Genial ProjectFlow Module Routes
    Route::prefix('projects')->name('projects.')->group(function () {
        Route::get('dashboard', [ProjectDashboardController::class, 'index'])->name('dashboard');
        Route::get('board', [ProjectBoardController::class, 'index'])->name('board');
        Route::post('store', [ProjectBoardController::class, 'storeProject'])->name('store');
        Route::post('tasks', [ProjectBoardController::class, 'storeTask'])->name('tasks.store');
        Route::put('tasks/{task}/status', [ProjectBoardController::class, 'updateTaskStatus'])->name('tasks.updateStatus');
        Route::post('tasks/{task}/comments', [ProjectBoardController::class, 'storeComment'])->name('tasks.comments.store');
        Route::put('checklists/{checklist}/toggle', [ProjectBoardController::class, 'toggleChecklist'])->name('checklists.toggle');
        Route::get('timeline', [ProjectTimelineController::class, 'index'])->name('timeline');
        Route::get('team', [ProjectTeamController::class, 'index'])->name('team');
        Route::get('reports', [ProjectReportController::class, 'index'])->name('reports');
    });
});

require __DIR__.'/settings.php';
