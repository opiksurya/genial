<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreativeService extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'format',
        'description',
        'deliverables',
        'client_price',
        'freelancer_cost',
        'unit',
        'turnaround_days',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'client_price' => 'decimal:2',
        'freelancer_cost' => 'decimal:2',
        'turnaround_days' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Estimated gross profit margin.
     */
    public function getEstimatedMarginAttribute(): float
    {
        if ($this->client_price <= 0) {
            return 0;
        }
        $profit = $this->client_price - $this->freelancer_cost;
        return round(($profit / $this->client_price) * 100, 1);
    }
}
