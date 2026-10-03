<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
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
            'short_description' => $this->short_description,
            'description' => $this->description,
            'specifications' => $this->specifications ?? [],
            'price' => (float) $this->price,
            'compare_price' => $this->compare_price ? (float) $this->compare_price : null,
            'discount_percent' => $discountPercent,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'condition' => $this->condition,
            'surat' => $this->surat,
            'garansi' => $this->garansi ?? '7 hari',
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => $this->rating_count,
            'sold_count' => $this->sold_count,
            'is_featured' => (bool) $this->is_featured,
            'is_flash_sale' => (bool) $this->is_flash_sale,
            'is_new' => (bool) $this->is_new,
            'is_booked' => (bool) $this->is_booked,
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($img) => [
                'id' => $img->id,
                'url' => str_starts_with($img->path, 'http') ? $img->path : asset('storage/'.$img->path),
                'alt' => $img->alt,
                'is_primary' => (bool) $img->is_primary,
            ])->values()),
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
                'size' => $v->size,
                'color' => $v->color,
                'price_adjustment' => (float) $v->price_adjustment,
                'stock' => $v->stock,
            ])->values()),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'brand' => $this->whenLoaded('brand', fn () => $this->brand ? [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ] : null),
        ];
    }
}
