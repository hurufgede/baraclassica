<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductCardResource;
use App\Models\Coupon;
use App\Models\Order;
use App\Services\CartService;
use App\Services\OrderService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orders, private CartService $carts) {}

    public function index(Request $request)
    {
        $q = Order::with(['items'])
            ->where('user_id', $request->user()->id)
            ->latest();

        if ($request->query('status')) {
            $q->where('status', $request->query('status'));
        }

        return ApiResponse::paginated(
            $q->paginate(10)->through(fn ($o) => new OrderResource($o))
        );
    }

    public function show(Request $request, string $id)
    {
        $order = Order::with(['items', 'payment'])
            ->where('user_id', $request->user()->id)
            ->where(fn ($w) => $w->where('id', $id)->orWhere('order_number', $id))
            ->firstOrFail();

        return ApiResponse::ok(new OrderResource($order));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:100',
            'customer_email' => 'nullable|email',
            'customer_phone' => 'required|string|max:30',
            'shipping_address' => 'required|string',
            'shipping_city' => 'required|string|max:100',
            'shipping_province' => 'required|string|max:100',
            'shipping_postal_code' => 'required|string|max:10',
            'shipping_method' => 'required|in:regular,express,same_day,pickup',
            'payment_method' => 'required|in:bank_transfer,e_wallet,va,cod,qris',
            'payment_provider' => 'nullable|string|max:50',
            'coupon_code' => 'nullable|string|max:50',
            'address_id' => 'nullable|exists:addresses,id',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $cart = $this->carts->current($request->user()?->id, $request->header('X-Session-Id', $request->ip()));
            $order = $this->orders->createFromCart($data, $cart, $request->user());

            return ApiResponse::created(new OrderResource($order), 'Pesanan berhasil dibuat.');
        } catch (\DomainException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function validateCoupon(Request $request)
    {
        $request->validate(['code' => 'required|string', 'subtotal' => 'required|numeric|min:0']);
        $coupon = Coupon::where('code', $request->code)->first();

        if (! $coupon || ! $coupon->isValid((float) $request->subtotal)) {
            return ApiResponse::error('Kupon tidak valid / minimum pembelian tidak terpenuhi.', 422);
        }

        return ApiResponse::ok([
            'code' => $coupon->code,
            'discount' => $coupon->calculateDiscount((float) $request->subtotal),
        ], 'Kupon valid.');
    }
}
