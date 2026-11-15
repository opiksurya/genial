<?php

namespace App\Models;

use Database\Factories\ShopeeConnectLinkFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * A single-use, expiring link that lets a shop owner authorize their Shopee shop for a project
 * without having an account in this application.
 */
class ShopeeConnectLink extends Model
{
    /** @use HasFactory<ShopeeConnectLinkFactory> */
    use HasFactory;

    public const TOKEN_LENGTH = 48;

    public const DEFAULT_DAYS = 7;

    public const MAX_DAYS = 30;

    protected $fillable = [
        'project_id',
        'token_hash',
        'created_by',
        'expires_at',
        'used_at',
        'revoked_at',
        'connected_shop_id',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Create a link and return it together with the plain token, which cannot be recovered later.
     *
     * @return array{link: self, token: string}
     */
    public static function issue(Project $project, int $days = self::DEFAULT_DAYS, ?int $createdBy = null): array
    {
        $token = Str::random(self::TOKEN_LENGTH);

        $link = self::create([
            'project_id' => $project->id,
            'token_hash' => self::hashToken($token),
            'created_by' => $createdBy,
            'expires_at' => now()->addDays(max(1, min($days, self::MAX_DAYS))),
        ]);

        return ['link' => $link, 'token' => $token];
    }

    public static function findByToken(string $token): ?self
    {
        if (strlen($token) !== self::TOKEN_LENGTH) {
            return null;
        }

        return self::where('token_hash', self::hashToken($token))->first();
    }

    public function isUsable(): bool
    {
        return $this->used_at === null
            && $this->revoked_at === null
            && $this->expires_at->isFuture();
    }

    /**
     * Links that can still be used to connect a shop.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeUsable(Builder $query): Builder
    {
        return $query->whereNull('used_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());
    }
}
