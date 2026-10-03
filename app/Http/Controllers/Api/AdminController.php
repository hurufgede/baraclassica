<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function stats()
    {
        $revenue = (float) Order::whereNotIn('status', ['cancelled', 'refunded'])->sum('grand_total');
        $orders = Order::count();
        $customers = User::where('is_admin', false)->count();
        $products = Product::count();
        $pending = Order::where('status', 'pending')->count();
        $lowStock = Product::where('stock', '<=', 5)->count();

        $recent = Order::with('user:id,name')->latest()->limit(8)->get();
        $topSelling = Product::orderByDesc('sold_count')->limit(5)->get(['id', 'name', 'sold_count', 'stock', 'price']);
        $revenueByMonth = Order::selectRaw("DATE_FORMAT(created_at,'%Y-%m') as month, SUM(grand_total) as total")
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->groupBy('month')->orderBy('month')->limit(12)->get();

        $salesChart = [];
        $totals = Order::whereNotIn('status', ['cancelled', 'refunded'])
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->get(['created_at', 'grand_total'])
            ->groupBy(fn ($o) => $o->created_at->format('Y-m-d'))
            ->map(fn ($rows) => round($rows->sum('grand_total'), 2));
        for ($i = 13; $i >= 0; $i--) {
            $day = now()->subDays($i);
            $key = $day->format('Y-m-d');
            $salesChart[] = ['date' => $key, 'label' => $day->format('d M'), 'total' => $totals->get($key, 0)];
        }

        return ApiResponse::ok(compact('revenue', 'orders', 'customers', 'products', 'pending', 'lowStock', 'recent', 'topSelling', 'revenueByMonth', 'salesChart'));
    }

    public function orders(Request $request)
    {
        $q = Order::with(['user:id,name,email', 'items'])->latest();
        if ($request->query('status')) {
            $q->where('status', $request->query('status'));
        }

        return ApiResponse::paginated($q->paginate(15));
    }

    public function orderDetail(string $id)
    {
        $order = Order::with(['user', 'items', 'payment', 'coupon'])->findOrFail($id);

        return ApiResponse::ok(new OrderResource($order->loadMissing(['items', 'payment'])));
    }

    public function updateOrderStatus(Request $request, string $id)
    {
        $data = $request->validate(['status' => 'required|in:pending,paid,processing,shipped,delivered,cancelled,refunded']);
        $order = Order::findOrFail($id);
        $order->status = $data['status'];

        if ($data['status'] === 'paid') {
            $order->paid_at = now();
            $order->payment_status = 'paid';
        }
        if ($data['status'] === 'shipped') {
            $order->shipped_at = now();
        }
        if ($data['status'] === 'delivered') {
            $order->delivered_at = now();
        }
        if ($data['status'] === 'refunded') {
            $order->payment_status = 'refunded';
        }
        $order->save();

        return ApiResponse::ok(new OrderResource($order->load(['items', 'payment'])), 'Status diperbarui.');
    }

    public function customers(Request $request)
    {
        $q = User::where('is_admin', false)->withCount('orders')->latest();

        return ApiResponse::paginated($q->paginate(15));
    }

    public function reviews(Request $request)
    {
        $q = Review::with(['product:id,name', 'user:id,name'])->latest();
        if ($request->query('status')) {
            $q->where('status', $request->query('status'));
        }

        return ApiResponse::paginated($q->paginate(15));
    }

    public function moderateReview(Request $request, string $id)
    {
        $data = $request->validate(['status' => 'required|in:approved,rejected']);
        $review = Review::findOrFail($id);
        $review->status = $data['status'];
        $review->save();

        $avg = Review::where('product_id', $review->product_id)->where('status', 'approved')->avg('rating') ?? 0;
        $count = Review::where('product_id', $review->product_id)->where('status', 'approved')->count();
        Product::where('id', $review->product_id)->update(['rating_avg' => round($avg, 2), 'rating_count' => $count]);

        return ApiResponse::ok($review, 'Review dimoderasi.');
    }
}
