<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FreelancerAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'freelancer_id',
        'project_id',
        'task_id',
        'title',
        'description',
        'brief_link',
        'submission_link',
        'fee_amount',
        'deadline',
        'status',
        'payment_status',
        'paid_at',
        'expense_id',
        'notes',
    ];

    protected $casts = [
        'fee_amount' => 'decimal:2',
        'deadline' => 'date',
        'paid_at' => 'datetime',
    ];

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }
}
