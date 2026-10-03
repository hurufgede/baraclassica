<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'name', 'sku', 'size', 'color', 'price_adjustment', 'stock'];
    protected $casts = ['price_adjustment' => 'decimal:2'];

    public function product() { return $this->belongsTo(Product::class); }
}
