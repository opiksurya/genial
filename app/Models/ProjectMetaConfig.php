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
        'access_token',
        'account_name',
        'currency',
        'timezone_name',
        'account_status',
        'status',
        'last_synced_at',
        'error_message',
        'meta_raw_data',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
        'meta_raw_data' => 'array',
        'last_synced_at' => 'datetime',
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
     * Format formatted ad account id (always with 'act_' prefix for API calls).
     */
    public function getFormattedAdAccountIdAttribute(): ?string
    {
        if (empty($this->ad_account_id)) {
            return null;
        }

        return str_starts_with($this->ad_account_id, 'act_') 
            ? $this->ad_account_id 
            : 'act_' . $this->ad_account_id;
    }
}
