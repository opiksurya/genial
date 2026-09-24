<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Freelancer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'role',
        'email',
        'phone',
        'portfolio_link',
        'rate_per_project',
        'rate_unit',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'access_token',
        'status',
        'notes',
    ];

    protected $casts = [
        'rate_per_project' => 'decimal:2',
    ];

    protected $appends = [
        'portal_url',
    ];

    protected static function booted(): void
    {
        static::creating(function ($freelancer) {
            if (empty($freelancer->access_token)) {
                $freelancer->access_token = Str::random(48);
            }
        });
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(FreelancerAssignment::class);
    }

    public function contentPlans(): HasMany
    {
        return $this->hasMany(ContentPlan::class);
    }

    public function getPortalUrlAttribute(): string
    {
        return url("/freelancer/portal/{$this->access_token}");
    }
}
