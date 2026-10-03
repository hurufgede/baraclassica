<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('items') ? $this->items : collect();
        $mapped = $items->map(fn ($i) => [
            'id' => $i->id,
            'qty' => $i->qty,
            'price' => (float) $i->price,
            'subtotal' => round((float) $i->price * $i->qty, 2),
            'product' => $i->relationLoaded('product') && $i->product ? [
                'id' => $i->product->id,
                'name' => $i->product->name,
                'slug' => $i->product->slug,
                'stock' => $i->product->stock,
                'image' => $i->product->primary_image_url,
            ] : null,
            'variant' => $i->relationLoaded('variant') && $i->variant ? [
                'id' => $i->variant->id,
                'name' => $i->variant->name,
                'size' => $i->variant->size,
                'color' => $i->variant->color,
            ] : null,
        ])->values();

        $subtotal = $mapped->sum('subtotal');

        return [
            'id' => $this->id,
            'items' => $mapped,
            'count' => $mapped->sum('qty'),
            'subtotal' => round($subtotal, 2),
        ];
    }
}
