<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMetaConfig extends Model
{
    protected $fillable = [
        'project_id',
        'ad_account_id',
        'pixel_id',
        'app_id',
        'app_secret',
        'access_token',
        'account_name',
        'currency',
        'timezone_name',
        'account_status',
        'fb_user_id',
        'fb_user_name',
        'status',
        'last_synced_at',
        'token_expires_at',
        'error_message',
        'meta_raw_data',
    ];

    protected $hidden = [
        'access_token',
        'app_secret',
    ];

    /**
     * Safe flags exposed instead of the hidden secrets.
     *
     * @var list<string>
     */
    protected $appends = [
        'has_access_token',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
        'app_secret' => 'encrypted',
        'meta_raw_data' => 'array',
        'last_synced_at' => 'datetime',
        'token_expires_at' => 'datetime',
        'account_status' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Check if connection is currently active and healthy.
     */
    public function isConnected(): bool
    {
        return $this->status === 'connected';
    }

    /**
     * Whether an access token is stored, without decrypting or exposing it.
     */
    public function getHasAccessTokenAttribute(): bool
    {
        return ! empty($this->attributes['access_token'] ?? null);
    }

    /**
     * Format formatted ad account id (always with 'act_' prefix for API calls).
     */
    public function getFormattedAdAccountIdAttribute(): ?string
    {
        if (empty($this->ad_account_id)) {
            return null;
        }

        return str_starts_with($this->ad_account_id, 'act_')
            ? $this->ad_account_id
            : 'act_'.$this->ad_account_id;
    }
}
