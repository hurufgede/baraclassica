<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AdminCouponController extends Controller
{
    public function index() { return ApiResponse::ok(Coupon::latest()->get()); }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:30|unique:coupons,code',
            'name' => 'required|string|max:100',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_purchase' => 'numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:starts_at',
            'is_active' => 'boolean',
        ]);

        return ApiResponse::created(Coupon::create($data), 'Kupon dibuat.');
    }

    public function show(string $id) { return ApiResponse::ok(Coupon::findOrFail($id)); }

    public function update(Request $request, string $id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->update($request->validate([
            'name' => 'sometimes|string|max:100',
            'type' => 'sometimes|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0',
            'min_purchase' => 'sometimes|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]));

        return ApiResponse::ok($coupon->fresh(), 'Kupon diperbarui.');
    }

    public function destroy(string $id)
    {
        Coupon::findOrFail($id)->delete();

        return ApiResponse::ok(null, 'Kupon dihapus.');
    }
}
