<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $q = Product::with(['category', 'brand'])->latest();
        if ($s = $request->query('search')) {
            $q->where('name', 'like', "%{$s}%");
        }

        return ApiResponse::paginated(
            $q->paginate(15)->through(fn ($p) => new ProductCardResource($p->loadMissing(['category', 'brand', 'images'])))
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'name' => 'required|string|max:200',
            'sku' => 'nullable|string|max:50|unique:products,sku',
            'short_description' => 'nullable|string',
            'description' => 'nullable|string',
            'specifications' => 'nullable|array',
            'price' => 'required|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'condition' => 'nullable|string|max:50',
            'surat' => 'nullable|string|max:100',
            'garansi' => 'nullable|string|max:100',
            'status' => 'in:active,draft,archived',
            'is_featured' => 'boolean',
            'is_flash_sale' => 'boolean',
            'is_new' => 'boolean',
            'images' => 'nullable|array|max:8',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $data['slug'] = Str::slug($data['name']).'-'.Str::lower(Str::random(5));
        $data['sku'] = $data['sku'] ?? 'SKU-'.strtoupper(Str::random(8));
        $data['garansi'] = $data['garansi'] ?? '7 hari';

        $product = Product::create($data);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $file) {
                $path = $file->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => $path,
                    'alt' => $product->name,
                    'is_primary' => $i === 0,
                    'sort_order' => $i,
                ]);
            }
        }

        return ApiResponse::created(new ProductCardResource($product->load(['category', 'brand', 'images'])), 'Produk dibuat.');
    }

    public function show(string $id)
    {
        $product = Product::with(['category', 'brand', 'images', 'variants'])->findOrFail($id);

        return ApiResponse::ok($product);
    }

    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);
        $data = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'name' => 'sometimes|string|max:200',
            'price' => 'sometimes|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'condition' => 'nullable|string|max:50',
            'surat' => 'nullable|string|max:100',
            'garansi' => 'nullable|string|max:100',
            'status' => 'in:active,draft,archived',
            'is_featured' => 'boolean',
            'is_flash_sale' => 'boolean',
            'is_new' => 'boolean',
            'is_booked' => 'boolean',
            'short_description' => 'nullable|string',
            'description' => 'nullable|string',
            'specifications' => 'nullable|array',
        ]);
        $product->update($data);

        return ApiResponse::ok(new ProductCardResource($product->load(['category', 'brand', 'images'])), 'Produk diperbarui.');
    }

    public function destroy(string $id)
    {
        Product::findOrFail($id)->delete();

        return ApiResponse::ok(null, 'Produk dihapus.');
    }

    public function markSold(Request $request, string $id)
    {
        $product = Product::findOrFail($id);
        $data = $request->validate([
            'qty' => 'nullable|integer|min:1',
            'sold_price' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:500',
        ]);

        $stock = max(1, (int) $product->stock);
        $qty = min($data['qty'] ?? 1, $stock);
        $price = (float) ($data['sold_price'] ?? $product->price);
        $total = round($price * $qty, 2);

        $order = \Illuminate\Support\Facades\DB::transaction(function () use ($product, $qty, $price, $total, $data) {
            $order = \App\Models\Order::create([
                'order_number' => 'OFF-'.now()->format('Ymd').'-'.strtoupper(\Illuminate\Support\Str::random(6)),
                'user_id' => null,
                'customer_name' => 'Penjualan offline',
                'customer_email' => null,
                'customer_phone' => '-',
                'shipping_address' => 'Penjualan offline (admin)',
                'shipping_city' => '-',
                'shipping_province' => '-',
                'shipping_postal_code' => '-',
                'subtotal' => $total,
                'discount_amount' => 0,
                'shipping_cost' => 0,
                'tax_amount' => 0,
                'grand_total' => $total,
                'shipping_method' => 'pickup',
                'payment_method' => 'offline',
                'payment_status' => 'paid',
                'status' => 'delivered',
                'notes' => $data['note'] ?? ("Laku: {$product->name} x{$qty} @ ".number_format($price, 0, ',', '.')),
                'paid_at' => now(),
                'delivered_at' => now(),
            ]);

            $order->items()->create([
                'product_id' => $product->id,
                'product_name' => $product->name,
                'sku' => $product->sku,
                'price' => $price,
                'qty' => $qty,
                'subtotal' => $total,
            ]);

            \App\Models\Payment::create([
                'order_id' => $order->id,
                'method' => 'offline',
                'reference_number' => 'OFF-'.strtoupper(\Illuminate\Support\Str::random(10)),
                'amount' => $total,
                'status' => 'success',
                'paid_at' => now(),
            ]);

            $product->increment('sold_count', $qty);
            $product->delete();

            return $order->load(['items']);
        });

        return ApiResponse::created($order, 'Tercatat laku Rp '.number_format($total, 0, ',', '.').'.');
    }
}
