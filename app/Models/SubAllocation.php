<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'allocation_id',
        'name',
        'percentage',
        'amount',
        'sort_order',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function allocation()
    {
        return $this->belongsTo(Allocation::class);
    }
}
