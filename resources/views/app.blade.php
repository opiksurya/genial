<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">

        @php
            $gtmId = \App\Models\Setting::get('gtm_id', env('GTM_ID', ''));
            $gtmEnabled = \App\Models\Setting::get('gtm_enabled', $gtmId ? '1' : '0') === '1';
            $ga4Id = \App\Models\Setting::get('ga4_id', env('GA4_ID', 'G-YRNS0SP4P7'));
            $ga4Enabled = \App\Models\Setting::get('ga4_enabled', '1') === '1';
        @endphp

        @if($ga4Enabled && $ga4Id)
            <!-- Google Analytics (GA4) -->
            <script async src="https://www.googletagmanager.com/gtag/js?id={{ trim($ga4Id) }}"></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '{{ trim($ga4Id) }}');
            </script>
        @endif

        @if($gtmEnabled && $gtmId)
            <!-- Google Tag Manager (GTM) -->
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','{{ trim($gtmId) }}');</script>
        @endif

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Genial Digital Solution') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
