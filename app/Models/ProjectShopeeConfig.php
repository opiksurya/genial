<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectShopeeConfig extends Model
{
    protected $fillable = [
        'project_id',
        'partner_id',
        'partner_key',
        'is_sandbox',
        'shop_id',
        'shop_name',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'refresh_expires_at',
        'status',
        'last_synced_at',
        'error_message',
        'shopee_raw_data',
    ];

    protected $hidden = [
        'partner_key',
        'access_token',
        'refresh_token',
    ];

    protected $casts = [
        'partner_key' => 'encrypted',
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'is_sandbox' => 'boolean',
        'token_expires_at' => 'datetime',
        'refresh_expires_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'shopee_raw_data' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Check if Shopee store connection is currently active and healthy.
     */
    public function isConnected(): bool
    {
        return $this->status === 'connected' && ! empty($this->access_token);
    }

    /**
     * Partner ID in effect: the project's own app if set, otherwise the shared app from config.
     */
    public function resolvedPartnerId(): ?string
    {
        $id = $this->partner_id ?: config('services.shopee.partner_id');

        return $id ? (string) $id : null;
    }

    /**
     * Partner key matching resolvedPartnerId(). Never mixes a project ID with the shared key.
     */
    public function resolvedPartnerKey(): ?string
    {
        if ($this->partner_id) {
            return $this->partner_key ?: null;
        }

        return config('services.shopee.partner_key') ?: null;
    }

    public function resolvedIsSandbox(): bool
    {
        return $this->partner_id
            ? (bool) $this->is_sandbox
            : (bool) config('services.shopee.sandbox');
    }

    public function hasCredentials(): bool
    {
        return $this->resolvedPartnerId() !== null && $this->resolvedPartnerKey() !== null;
    }

    /**
     * True when the access token is missing or expires within the given number of seconds.
     */
    public function accessTokenExpiresWithin(int $seconds): bool
    {
        return $this->token_expires_at === null
            || $this->token_expires_at->lte(now()->addSeconds($seconds));
    }

    /**
     * Get base URL for Shopee Open API according to sandbox toggle.
     */
    public function getBaseUrl(): string
    {
        return $this->resolvedIsSandbox()
            ? 'https://partner.test-stable.shopeemobile.com'
            : 'https://partner.shopeemobile.com';
    }
}
