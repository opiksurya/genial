<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'whatsapp',
        'website_marketplace',
        'business_type',
        'target_sales',
        'status',
        'ip_address',
    ];
}
