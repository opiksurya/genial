<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property string|null $calendar_feed_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'google_id', 'avatar', 'google_access_token', 'google_refresh_token', 'google_token_expires_at', 'google_calendar_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'google_access_token', 'google_refresh_token', 'calendar_feed_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Give every new user a secret token for the private meetings calendar feed.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            $user->calendar_feed_token ??= static::generateCalendarFeedToken();
        });
    }

    /**
     * Create a random 64-character token for the meetings calendar feed URL.
     */
    public static function generateCalendarFeedToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Replace the calendar feed token so that previously shared feed URLs stop working.
     */
    public function regenerateCalendarFeedToken(): string
    {
        $this->forceFill(['calendar_feed_token' => static::generateCalendarFeedToken()])->save();

        return $this->calendar_feed_token;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'google_token_expires_at' => 'datetime',
        ];
    }

    public function projectMemberships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function projects(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members', 'user_id', 'project_id')->withPivot('role');
    }
}
