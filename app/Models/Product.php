<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id', 'brand_id', 'name', 'slug', 'sku',
        'short_description', 'description', 'specifications',
        'price', 'compare_price', 'discount_percent',
        'stock', 'condition', 'surat', 'garansi', 'sold_count', 'status',
        'is_featured', 'is_flash_sale', 'is_new', 'is_booked',
        'rating_avg', 'rating_count',
    ];

    protected $casts = [
        'specifications' => 'array',
        'price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_flash_sale' => 'boolean',
        'is_new' => 'boolean',
        'is_booked' => 'boolean',
        'rating_avg' => 'decimal:2',
    ];

    protected $appends = ['discount_price', 'primary_image_url'];

    public function category() { return $this->belongsTo(Category::class); }
    public function brand() { return $this->belongsTo(Brand::class); }
    public function images() { return $this->hasMany(ProductImage::class)->orderBy('sort_order'); }
    public function primaryImage() { return $this->hasOne(ProductImage::class)->where('is_primary', true); }
    public function variants() { return $this->hasMany(ProductVariant::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function approvedReviews() { return $this->hasMany(Review::class)->where('status', 'approved'); }

    public function getDiscountPriceAttribute(): float
    {
        if ($this->compare_price && $this->compare_price > $this->price) {
            return (float) $this->price;
        }
        return (float) $this->price;
    }

    public function getPrimaryImageUrlAttribute(): ?string
    {
        $img = $this->relationLoaded('images')
            ? $this->images->firstWhere('is_primary', true) ?? $this->images->first()
            : $this->primaryImage;
        if (! $img) {
            return null;
        }
        $path = $img instanceof ProductImage ? $img->path : ($img['path'] ?? null);
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return asset('storage/'.$path);
    }

    public function getEffectiveDiscountPercentAttribute(): float
    {
        if ($this->compare_price && $this->compare_price > 0 && $this->compare_price > $this->price) {
            return round((($this->compare_price - $this->price) / $this->compare_price) * 100, 1);
        }

        return (float) $this->discount_percent;
    }

    public function scopeActive($q) { return $q->where('status', 'active'); }
    public function scopeFeatured($q) { return $q->where('is_featured', true); }
    public function scopeFlashSale($q) { return $q->where('is_flash_sale', true); }
    public function scopeInStock($q) { return $q->where('stock', '>', 0); }
}
