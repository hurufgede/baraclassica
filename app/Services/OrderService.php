<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function createFromCart(array $data, \App\Models\Cart $cart, ?\App\Models\User $user): Order
    {
        $cart->load(['items.product', 'items.variant']);
        if ($cart->items->isEmpty()) {
            throw new \DomainException('Keranjang masih kosong.');
        }

        return DB::transaction(function () use ($data, $cart, $user) {
            $subtotal = $cart->items->sum(fn ($i) => (float) $i->price * $i->qty);

            $coupon = null;
            $discount = 0;
            if (! empty($data['coupon_code'])) {
                $coupon = Coupon::where('code', $data['coupon_code'])->first();
                if ($coupon && $coupon->isValid($subtotal)) {
                    $discount = $coupon->calculateDiscount($subtotal);
                } else {
                    $coupon = null;
                    $discount = 0;
                }
            }

            $shippingCosts = ['regular' => 15000, 'express' => 30000, 'same_day' => 45000, 'pickup' => 0];
            $shippingCost = $shippingCosts[$data['shipping_method']] ?? 15000;
            $tax = round(($subtotal - $discount) * 0.11, 2);
            $grandTotal = round($subtotal - $discount + $shippingCost + $tax, 2);

            $order = Order::create([
                'order_number' => 'APN-'.now()->format('Ymd').'-'.strtoupper(Str::random(6)),
                'user_id' => $user?->id,
                'address_id' => $data['address_id'] ?? null,
                'coupon_id' => $coupon?->id,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? $user?->email,
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => $data['shipping_address'],
                'shipping_city' => $data['shipping_city'],
                'shipping_province' => $data['shipping_province'],
                'shipping_postal_code' => $data['shipping_postal_code'],
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'shipping_cost' => $shippingCost,
                'tax_amount' => $tax,
                'grand_total' => $grandTotal,
                'shipping_method' => $data['shipping_method'],
                'payment_method' => $data['payment_method'],
                'payment_status' => $data['payment_method'] === 'cod' ? 'unpaid' : 'unpaid',
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name' => $item->product->name,
                    'variant_name' => $item->variant?->name,
                    'sku' => $item->variant?->sku ?? $item->product->sku,
                    'price' => $item->price,
                    'qty' => $item->qty,
                    'subtotal' => (float) $item->price * $item->qty,
                ]);

                if ($item->product_variant_id && $item->variant) {
                    $item->variant->decrement('stock', $item->qty);
                } else {
                    $item->product->decrement('stock', $item->qty);
                }
                $item->product->increment('sold_count', $item->qty);
            }

            Payment::create([
                'order_id' => $order->id,
                'method' => $data['payment_method'],
                'provider' => $data['payment_provider'] ?? null,
                'reference_number' => 'PAY-'.strtoupper(Str::random(10)),
                'amount' => $grandTotal,
                'status' => 'pending',
            ]);

            if ($coupon) {
                $coupon->increment('used_count');
                $coupon->usages()->create([
                    'user_id' => $user?->id,
                    'order_id' => $order->id,
                    'discount_amount' => $discount,
                ]);
            }

            if ($user) {
                $user->notify(new \App\Notifications\OrderCreatedNotification($order));
            }

            $cart->items()->delete();

            return $order->load(['items', 'payment']);
        });
    }
}
