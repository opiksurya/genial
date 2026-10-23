<?php

use Inertia\Testing\AssertableInertia as Assert;

test('the privacy policy page renders', function () {
    $this->get(route('privacy-policy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('privacy-policy')
            ->has('whatsappNumber'));
});

test('the terms page renders', function () {
    $this->get(route('terms'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('terms'));
});

test('the oauth callback reports success when a code is returned without exposing it', function () {
    $this->get(route('oauth.callback', ['code' => 'secret-auth-code', 'state' => 'xyz']))
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $page) => $page
            ->component('oauth-callback')
            ->where('status', 'success')
            ->where('errorMessage', null)
            ->missing('code'));
});

test('the oauth callback reports the provider error', function () {
    $this->get(route('oauth.callback', ['error' => 'access_denied', 'error_description' => 'User denied access']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('status', 'error')
            ->where('errorMessage', 'User denied access'));
});

test('the oauth callback tolerates empty and malformed query strings', function () {
    $this->get(route('oauth.callback'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('status', 'empty'));

    $this->get('/oauth/callback?error[]=x&code[]=y')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('status', 'empty'));
});
