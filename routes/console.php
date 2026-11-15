<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Shopee access tokens last ~4 hours; keep them alive. Requires the server cron: * * * * * php artisan schedule:run
Schedule::command('shopee:refresh-tokens')->everyThirtyMinutes()->withoutOverlapping();
