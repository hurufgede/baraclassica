<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $carts) {}

    private function resolveCart(Request $request)
    {
        return $this->carts->current(
            $request->user()?->id,
            $request->header('X-Session-Id', $request->ip())
        );
    }

    public function index(Request $request)
    {
        $cart = $this->resolveCart($request);
        $cart->load(['items.product.images', 'items.variant']);

        return ApiResponse::ok(new CartResource($cart));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty' => 'integer|min:1|max:99',
            'variant_id' => 'nullable|exists:product_variants,id',
        ]);

        try {
            $cart = $this->resolveCart($request);
            $this->carts->add($cart, $data['product_id'], $data['qty'] ?? 1, $data['variant_id'] ?? null);
            $cart->load(['items.product.images', 'items.variant']);

            return ApiResponse::created(new CartResource($cart), 'Ditambahkan ke keranjang.');
        } catch (\DomainException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function update(Request $request, string $id)
    {
        $data = $request->validate(['qty' => 'required|integer|min:1|max:99']);
        $cart = $this->resolveCart($request);
        $item = $cart->items()->findOrFail($id);

        try {
            $this->carts->updateQty($item, $data['qty']);
            $cart->load(['items.product.images', 'items.variant']);

            return ApiResponse::ok(new CartResource($cart), 'Kuantitas diperbarui.');
        } catch (\DomainException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function destroy(Request $request, string $id)
    {
        $cart = $this->resolveCart($request);
        $cart->items()->where('id', $id)->delete();
        $cart->load(['items.product.images', 'items.variant']);

        return ApiResponse::ok(new CartResource($cart), 'Item dihapus.');
    }
}
