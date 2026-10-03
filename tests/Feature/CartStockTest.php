<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Str;
use Tests\TestCase;

class CartStockTest extends TestCase
{
    public function test_cart_qty_cannot_exceed_stock(): void
    {
        $src = Product::first();
        $this->assertNotNull($src);

        $test = Product::create([
            'category_id' => $src->category_id,
            'name' => 'TEST STOK '.uniqid(),
            'slug' => 'test-stok-'.strtolower(Str::random(5)),
            'sku' => 'TEST-'.strtoupper(Str::random(6)),
            'price' => 10000000,
            'stock' => 1,
            'status' => 'active',
        ]);

        $headers = ['X-Session-Id' => 'uji-stok-'.Str::random(6)];

        try {
            $this->withHeaders($headers)
                ->postJson('/api/cart/items', ['product_id' => $test->id, 'qty' => 1])
                ->assertCreated();

            $this->withHeaders($headers)
                ->postJson('/api/cart/items', ['product_id' => $test->id, 'qty' => 1])
                ->assertStatus(422);

            $cart = $this->withHeaders($headers)->getJson('/api/cart')->assertOk();
            $items = collect($cart->json('data.items'));
            $this->assertSame(1, (int) $items->sum('qty'));

            $itemId = $items->first()['id'];
            $this->withHeaders($headers)
                ->putJson("/api/cart/items/{$itemId}", ['qty' => 7])
                ->assertStatus(422);
        } finally {
            Cart::where('session_id', $headers['X-Session-Id'])->delete();
            $test->forceDelete();
        }
    }
}
