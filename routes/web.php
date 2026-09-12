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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
