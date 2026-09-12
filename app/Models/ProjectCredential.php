<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ProjectCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'platform',
        'title',
        'username_email',
        'password',
        'url_link',
        'notes',
        'created_by',
    ];

    protected $appends = ['decrypted_password'];

    public function setPasswordAttribute($value)
    {
        if (!empty($value)) {
            $this->attributes['password'] = Crypt::encryptString($value);
        } else {
            $this->attributes['password'] = null;
        }
    }

    public function getDecryptedPasswordAttribute()
    {
        if (empty($this->attributes['password'])) {
            return '';
        }

        try {
            return Crypt::decryptString($this->attributes['password']);
        } catch (\Throwable $e) {
            return $this->attributes['password'];
        }
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
