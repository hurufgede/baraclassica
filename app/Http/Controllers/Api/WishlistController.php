<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Models\Product;
use App\Models\Wishlist;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $wishlist = Wishlist::firstOrCreate(['user_id' => $request->user()->id]);
        $products = Product::active()
            ->with(['category', 'brand', 'images'])
            ->whereIn('id', $wishlist->items()->pluck('product_id'))
            ->get();

        return ApiResponse::ok(ProductCardResource::collection($products));
    }

    public function store(Request $request)
    {
        $data = $request->validate(['product_id' => 'required|exists:products,id']);
        $wishlist = Wishlist::firstOrCreate(['user_id' => $request->user()->id]);
        $wishlist->items()->firstOrCreate(['product_id' => $data['product_id']]);

        return ApiResponse::created(null, 'Ditambahkan ke wishlist.');
    }

    public function destroy(Request $request, string $id)
    {
        $wishlist = Wishlist::where('user_id', $request->user()->id)->firstOrFail();
        $wishlist->items()->where('product_id', $id)->delete();

        return ApiResponse::ok(null, 'Dihapus dari wishlist.');
    }
}
