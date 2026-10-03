<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'path', 'alt', 'is_primary', 'sort_order'];
    protected $casts = ['is_primary' => 'boolean'];
    protected $appends = ['url'];

    public function product() { return $this->belongsTo(Product::class); }

    public function getUrlAttribute(): string
    {
        if (str_starts_with($this->path, 'http')) {
            return $this->path;
        }

        return asset('storage/'.$this->path);
    }
}
