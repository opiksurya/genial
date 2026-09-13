<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Project extends Model
{
    protected $fillable = [
        'name',
        'client',
        'client_logo',
        'description',
        'category',
        'status',
        'priority',
        'progress',
        'start_date',
        'end_date',
        'manager_id',
        'agent_id',
        'is_show_on_home',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'progress' => 'integer',
        'is_show_on_home' => 'boolean',
    ];

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'agent_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(ProjectCredential::class);
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }


    /**
     * Recalculate progress % automatically based on completed tasks.
     */
    public function recalculateProgress(): void
    {
        $total = $this->tasks()->count();
        if ($total === 0) {
            $this->update(['progress' => 0]);
            return;
        }

        $completed = $this->tasks()->where('status', 'DONE')->count();
        $progressPercent = (int) round(($completed / $total) * 100);

        $status = $this->status;
        if ($progressPercent === 100) {
            $status = 'Completed';
        } elseif ($progressPercent > 0 && $status === 'Planning') {
            $status = 'In Progress';
        }

        $this->update([
            'progress' => $progressPercent,
            'status' => $status,
        ]);
    }
}
