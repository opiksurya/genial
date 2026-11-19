<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        // Let people with an unknown Google email create a Client account (no project access until an admin links one).
        'allow_signup' => (bool) env('GOOGLE_ALLOW_SIGNUP', true),
        'redirect' => env('GOOGLE_REDIRECT_URI', '/auth/google/callback'),
    ],

    'facebook' => [
        'client_id' => env('META_APP_ID', env('FACEBOOK_CLIENT_ID')),
        'client_secret' => env('META_APP_SECRET', env('FACEBOOK_CLIENT_SECRET')),
        'redirect' => env('META_REDIRECT_URI', env('FACEBOOK_REDIRECT_URI')),
    ],

    'shopee' => [
        // One Shopee Open Platform app (partner) shared by every client shop.
        // Per-project credentials on ProjectShopeeConfig still override these.
        'partner_id' => env('SHOPEE_PARTNER_ID'),
        'partner_key' => env('SHOPEE_PARTNER_KEY'),
        'sandbox' => (bool) env('SHOPEE_SANDBOX', false),
        // Must exactly match the Redirect URL registered in the Shopee console.
        'redirect' => env('SHOPEE_REDIRECT_URI'),
        // Must exactly match the Push URL registered in the Shopee console.
        'webhook_url' => env('SHOPEE_WEBHOOK_URL'),
    ],

    'claude_office' => [
        'url' => env('CLAUDE_OFFICE_URL'),
    ],

];
