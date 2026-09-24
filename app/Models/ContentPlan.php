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
        'status',
        'reference_link',
        'visual_detail',
        'wording',
        'copywriting',
        'hashtags',
        'notes',
        'meta_data',
    ];

    protected $casts = [
        'scheduled_date' => 'date:Y-m-d',
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
}
