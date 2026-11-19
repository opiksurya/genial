<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Spatie\Permission\Models\Role;

class GoogleController extends Controller
{
    /**
     * Scopes for plain sign-in: non-sensitive, so the Google app can be published
     * without a verification review.
     *
     * @var list<string>
     */
    protected array $loginScopes = ['openid', 'email', 'profile'];

    /**
     * Scopes required for Google Calendar API integration (sensitive scope).
     *
     * @var list<string>
     */
    protected array $calendarScopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'email',
        'profile',
        'openid',
    ];

    /**
     * Redirect the user to the Google authentication page for login or sign-up.
     */
    public function redirectToGoogle()
    {
        session()->forget('google_oauth_mode');

        return Socialite::driver('google')
            ->scopes($this->loginScopes)
            ->with(['prompt' => 'select_account'])
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

            // Calendar connection: only here are Google tokens stored.
            if ($mode === 'calendar_connect' && Auth::check()) {
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

            if (Auth::check()) {
                return redirect()->intended('/dashboard');
            }

            // Sign-in and sign-up only ever trust an email that Google has verified.
            $raw = $googleUser->user;
            $email = $googleUser->getEmail();

            if (! $email || ! filter_var($raw['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                return redirect()->route('login')->withErrors([
                    'email' => 'Email Google Anda belum terverifikasi, jadi tidak bisa dipakai untuk masuk.',
                ]);
            }

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $email)
                ->first();

            if (! $user) {
                if (! config('services.google.allow_signup')) {
                    return redirect()->route('login')->withErrors([
                        'email' => 'Email ('.$email.') belum terdaftar di sistem. Pendaftaran akun hanya dapat dilakukan oleh Super Admin.',
                    ]);
                }

                $user = $this->registerClient($googleUser->getName(), $email, $googleUser->getId(), $googleUser->getAvatar());
            } else {
                // Sign-in never touches calendar tokens: they were issued for a wider scope.
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar() ?: $user->avatar,
                ]);
            }

            Auth::login($user, true);

            return redirect()->intended('/dashboard');
        } catch (\Exception $e) {
            return redirect('/meetings')->with('error', 'Gagal menghubungkan Google Calendar: '.$e->getMessage());
        }
    }

    /**
     * Self sign-up: a Client account that belongs to no project yet, so it sees an
     * empty portal until an admin links it to one.
     */
    private function registerClient(?string $name, string $email, string $googleId, ?string $avatar): User
    {
        $user = new User;
        $user->forceFill([
            'name' => $name ?: Str::before($email, '@'),
            'email' => $email,
            'google_id' => $googleId,
            'avatar' => $avatar,
            'password' => Str::random(48),
            'email_verified_at' => now(),
        ])->save();

        Role::findOrCreate('Client', 'web');
        $user->assignRole('Client');

        return $user;
    }
}
