<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'income_id',
        'project_id',
        'parent_id',
        'name',
        'percentage',
        'amount',
        'sort_order',
        'approval_status',
        'approved_by',
        'created_by',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function income()
    {
        return $this->belongsTo(Income::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function parent()
    {
        return $this->belongsTo(Allocation::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Allocation::class, 'parent_id')->orderBy('sort_order');
    }

    public function subAllocations()
    {
        return $this->hasMany(SubAllocation::class)->orderBy('sort_order');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
