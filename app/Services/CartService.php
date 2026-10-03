<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class CartService
{
    public function current(?int $userId, ?string $sessionId): Cart
    {
        if ($userId) {
            return Cart::firstOrCreate(['user_id' => $userId]);
        }

        return Cart::firstOrCreate(['session_id' => $sessionId ?? 'guest']);
    }

    public function add(Cart $cart, int $productId, int $qty = 1, ?int $variantId = null): CartItem
    {
        $product = Product::active()->findOrFail($productId);

        $price = (float) $product->price;
        if ($variantId) {
            $variant = ProductVariant::where('product_id', $product->id)->findOrFail($variantId);
            $price += (float) $variant->price_adjustment;
            $stock = $variant->stock;
        } else {
            $stock = $product->stock;
        }

        if ($stock < $qty) {
            throw new \DomainException('Stok tidak mencukupi.');
        }

        return DB::transaction(function () use ($cart, $product, $qty, $variantId, $price, $stock) {
            $item = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $product->id)
                ->where('product_variant_id', $variantId)
                ->first();

            if ($item) {
                $total = $item->qty + $qty;
                if ($total > $stock) {
                    throw new \DomainException('Stok tidak mencukupi. Sisa stok '.$stock.'.');
                }
                $item->qty = $total;
                $item->price = $price;
                $item->save();
            } else {
                $item = CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $variantId,
                    'qty' => $qty,
                    'price' => $price,
                ]);
            }

            return $item->load(['product.images', 'variant']);
        });
    }

    public function updateQty(CartItem $item, int $qty): CartItem
    {
        if ($qty < 1) {
            throw new \DomainException('Qty minimal 1.');
        }
        $item->loadMissing(['product', 'variant']);
        $stock = $item->product_variant_id && $item->variant
            ? $item->variant->stock
            : $item->product->stock;
        if ($qty > $stock) {
            throw new \DomainException('Stok tidak mencukupi. Sisa stok '.$stock.'.');
        }
        $item->qty = $qty;
        $item->save();

        return $item->load(['product.images', 'variant']);
    }

    public function summary(Cart $cart): array
    {
        $cart->load(['items.product.images', 'items.variant']);
        $subtotal = $cart->items->sum(fn ($i) => (float) $i->price * $i->qty);
        $count = $cart->items->sum('qty');

        return ['subtotal' => round($subtotal, 2), 'count' => $count];
    }

    public function clear(Cart $cart): void
    {
        $cart->items()->delete();
    }
}
