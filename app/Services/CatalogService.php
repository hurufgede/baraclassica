<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CatalogService
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        $q = Product::query()->active()->with(['category', 'brand', 'images', 'primaryImage']);

        if (! empty($filters['search'])) {
            $s = $filters['search'];
            $q->where(function ($w) use ($s) {
                $w->where('name', 'like', "%{$s}%")
                    ->orWhere('sku', 'like', "%{$s}%")
                    ->orWhere('description', 'like', "%{$s}%");
            });
        }
        if (! empty($filters['category'])) {
            $q->whereHas('category', fn ($w) => $w->where('slug', $filters['category']));
        }
        if (! empty($filters['brand'])) {
            $q->whereHas('brand', fn ($w) => $w->where('slug', $filters['brand']));
        }
        if (isset($filters['min_price']) && is_numeric($filters['min_price'])) {
            $q->where('price', '>=', $filters['min_price']);
        }
        if (isset($filters['max_price']) && is_numeric($filters['max_price'])) {
            $q->where('price', '<=', $filters['max_price']);
        }
        if (! empty($filters['min_rating'])) {
            $q->where('rating_avg', '>=', $filters['min_rating']);
        }
        if (! empty($filters['in_stock'])) {
            $q->where('stock', '>', 0);
        }
        if (! empty($filters['is_featured'])) {
            $q->where('is_featured', true);
        }
        if (! empty($filters['is_flash_sale'])) {
            $q->where('is_flash_sale', true);
        }
        if (! empty($filters['is_new'])) {
            $q->where('is_new', true);
        }
        if (! empty($filters['is_booked'])) {
            $q->where('is_booked', true);
        }

        $sort = $filters['sort'] ?? 'latest';
        match ($sort) {
            'price_asc' => $q->orderBy('price', 'asc'),
            'price_desc' => $q->orderBy('price', 'desc'),
            'rating' => $q->orderByDesc('rating_avg'),
            'best_selling' => $q->orderByDesc('sold_count'),
            'name' => $q->orderBy('name'),
            default => $q->latest(),
        };

        $perPage = min(max((int) ($filters['per_page'] ?? 12), 1), 48);

        return $q->paginate($perPage)->withQueryString();
    }

    public function findBySlugOrId(string $key): Product
    {
        return Product::active()
            ->with(['category', 'brand', 'images', 'variants'])
            ->where('slug', $key)
            ->orWhere('id', is_numeric($key) ? $key : -1)
            ->firstOrFail();
    }

    public function related(Product $product, int $limit = 8)
    {
        return Product::active()
            ->with(['category', 'brand', 'images'])
            ->where('id', '!=', $product->id)
            ->where('category_id', $product->category_id)
            ->inStock()
            ->limit($limit)
            ->get();
    }

    public function suggestions(string $keyword, int $limit = 6)
    {
        return Product::active()
            ->with(['category', 'images'])
            ->where('name', 'like', "%{$keyword}%")
            ->limit($limit)
            ->get();
    }
}
