<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Agent extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'access_token',
        'commission_rate',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'status',
        'notes',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
    ];

    protected $appends = [
        'portal_url',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($agent) {
            if (empty($agent->access_token)) {
                $agent->access_token = Str::random(40);
            }
        });
    }

    public function getPortalUrlAttribute(): string
    {
        return url('/agent/portal/' . $this->access_token);
    }

    public function commissions()
    {
        return $this->hasMany(AgentCommission::class);
    }

    public function incomes()
    {
        return $this->hasMany(Income::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
