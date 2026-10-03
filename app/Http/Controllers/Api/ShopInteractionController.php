<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ShopInteractionController extends Controller
{
    public function index(string $id)
    {
        $reviews = Review::with('user:id,name')
            ->where('product_id', $id)
            ->where('status', 'approved')
            ->latest()
            ->paginate(10);

        return ApiResponse::paginated($reviews);
    }

    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:150',
            'comment' => 'nullable|string|max:2000',
        ]);

        $review = Review::create([
            'product_id' => $id,
            'user_id' => $request->user()->id,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'comment' => $data['comment'] ?? null,
            'status' => 'pending',
        ]);

        $avg = Review::where('product_id', $id)->where('status', 'approved')->avg('rating') ?? $data['rating'];
        $count = Review::where('product_id', $id)->where('status', 'approved')->count();
        Product::where('id', $id)->update(['rating_avg' => round((float) $avg, 2), 'rating_count' => $count]);

        return ApiResponse::created($review, 'Ulasan dikirim, menunggu moderasi.');
    }
}
