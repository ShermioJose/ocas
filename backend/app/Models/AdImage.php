<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdImage extends Model
{
    protected $fillable = [
        'ad_id',
        'image_url',
        'cloudinary_public_id',
        'is_primary',
        'sort_order'
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function ad()
    {
        return $this->belongsTo(Ad::class);
    }
}
