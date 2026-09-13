<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'income_id',
        'project_id',
        'client_name',
        'income_amount',
        'commission_rate',
        'commission_amount',
        'payment_status',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'income_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    public function income()
    {
        return $this->belongsTo(Income::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
