<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primary = $this->relationLoaded('images')
            ? ($this->images->firstWhere('is_primary', true) ?? $this->images->first())
            : $this->primaryImage;

        $imageUrl = null;
        if ($primary) {
            $path = $primary instanceof \App\Models\ProductImage ? $primary->path : ($primary['path'] ?? null);
            if ($path) {
                $imageUrl = str_starts_with($path, 'http') ? $path : asset('storage/'.$path);
            }
        }

        $discountPercent = 0;
        if ($this->compare_price && $this->compare_price > $this->price) {
            $discountPercent = round((($this->compare_price - $this->price) / $this->compare_price) * 100, 1);
        } elseif ($this->discount_percent > 0) {
            $discountPercent = (float) $this->discount_percent;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'price' => (float) $this->price,
            'compare_price' => $this->compare_price ? (float) $this->compare_price : null,
            'discount_percent' => $discountPercent,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'condition' => $this->condition ?? null,
            'surat' => $this->surat ?? null,
            'garansi' => $this->garansi ?? '7 hari',
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => $this->rating_count,
            'sold_count' => $this->sold_count,
            'is_featured' => (bool) $this->is_featured,
            'is_flash_sale' => (bool) $this->is_flash_sale,
            'is_new' => (bool) $this->is_new,
            'is_booked' => (bool) $this->is_booked,
            'image' => $imageUrl,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'brand' => $this->whenLoaded('brand', fn () => [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ]),
        ];
    }
}
