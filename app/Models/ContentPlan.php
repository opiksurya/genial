<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'project_id',
        'brand_name',
        'title',
        'scheduled_date',
        'scheduled_time',
        'platform',
        'format',
        'pillar',
        'freelancer_id',
        'status',
        'freelancer_status',
        'payout_status',
        'freelancer_fee',
        'paid_at',
        'expense_id',
        'reference_link',
        'submission_link',
        'freelancer_notes',
        'visual_detail',
        'wording',
        'copywriting',
        'hashtags',
        'notes',
        'meta_data',
    ];

    protected $casts = [
        'scheduled_date' => 'date:Y-m-d',
        'freelancer_fee' => 'decimal:2',
        'paid_at' => 'datetime',
        'meta_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }
}
