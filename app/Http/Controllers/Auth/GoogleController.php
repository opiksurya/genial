<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    /**
     * Scopes required for Google Calendar API integration.
     */
    protected array $calendarScopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'email',
        'profile',
        'openid',
    ];

    /**
     * Redirect the user to the Google authentication page for login.
     */
    public function redirectToGoogle()
    {
        session()->forget('google_oauth_mode');

        return Socialite::driver('google')
            ->scopes($this->calendarScopes)
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent select_account',
            ])
            ->redirect();
    }

    /**
     * Connect or authorize Google Calendar API for current authenticated user.
     */
    public function connectCalendar()
    {
        session(['google_oauth_mode' => 'calendar_connect']);

        return Socialite::driver('google')
            ->scopes($this->calendarScopes)
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent select_account',
            ])
            ->redirect();
    }

    /**
     * Disconnect Google Calendar API for current authenticated user.
     */
    public function disconnectCalendar(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->update([
                'google_access_token' => null,
                'google_refresh_token' => null,
                'google_token_expires_at' => null,
            ]);
        }

        return redirect()->back()->with('success', 'Koneksi Google Calendar API berhasil diputuskan.');
    }

    /**
     * Obtain the user information from Google and save tokens.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            $mode = session('google_oauth_mode');
            session()->forget('google_oauth_mode');

            // If already logged in or mode is calendar_connect
            if (Auth::check()) {
                $user = Auth::user();
                $user->update([
                    'google_id' => $googleUser->getId() ?: $user->google_id,
                    'avatar' => $googleUser->getAvatar() ?: $user->avatar,
                    'google_access_token' => $googleUser->token,
                    'google_refresh_token' => $googleUser->refreshToken ?? $user->google_refresh_token,
                    'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn ?? 3600),
                ]);

                return redirect('/meetings')->with('success', 'Google Calendar API berhasil terhubung! Agenda otomatis tersinkron via API di latar belakang.');
            }

            // Normal login flow
            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if (! $user) {
                return redirect()->route('login')->withErrors([
                    'email' => 'Email ('.$googleUser->getEmail().') belum terdaftar di sistem. Pendaftaran akun hanya dapat dilakukan oleh Super Admin.',
                ]);
            }

            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'google_access_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken ?? $user->google_refresh_token,
                'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn ?? 3600),
            ]);

            Auth::login($user, true);

            return redirect()->intended('/dashboard');
        } catch (\Exception $e) {
            return redirect('/meetings')->with('error', 'Gagal menghubungkan Google Calendar: '.$e->getMessage());
        }
    }
}
