<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'label',
        'link',
        'assignee_id',
        'assignee_role',
        'start_date',
        'due_date',
        'order',
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->latest();
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(TaskChecklist::class);
    }

    public function dependencies(): HasMany
    {
        return $this->hasMany(TaskDependency::class);
    }

    /**
     * Calculate task duration in days.
     */
    public function getDurationDaysAttribute(): int
    {
        if (!$this->start_date || !$this->due_date) {
            return 1;
        }

        return max(1, $this->start_date->diffInDays($this->due_date) + 1);
    }
}
