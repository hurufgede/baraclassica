<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class MarkSoldTest extends TestCase
{
    public function test_mark_sold_records_revenue_and_removes_product(): void
    {
        $admin = User::where('is_admin', true)->first();
        $this->assertNotNull($admin, 'butuh 1 admin di DB');

        $src = Product::first();
        $this->assertNotNull($src, 'butuh 1 produk di DB');

        $test = Product::create([
            'category_id' => $src->category_id,
            'name' => 'TEST LAKU '.uniqid(),
            'slug' => 'test-laku-'.strtolower(Str::random(5)),
            'sku' => 'TEST-'.strtoupper(Str::random(6)),
            'price' => 25000000,
            'stock' => 1,
            'status' => 'active',
        ]);

        try {
            $res = $this->actingAs($admin, 'sanctum')
                ->postJson("/api/admin/admin-products/{$test->id}/mark-sold", [
                    'qty' => 1, 'sold_price' => 25000000,
                ]);
            $res->assertCreated();

            $this->assertNull(Product::find($test->id), 'produk harus terhapus');

            $order = Order::where('order_number', 'like', 'OFF-%')->latest()->first();
            $this->assertNotNull($order, 'order offline harus tercipta');
            $this->assertEquals(25000000, (float) $order->grand_total);
            $this->assertSame('delivered', $order->status);

            $stats = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/stats');
            $stats->assertOk();
            $data = $stats->json('data');
            $this->assertGreaterThanOrEqual(25000000, (float) $data['revenue']);

            $today = date('Y-m-d');
            $point = collect($data['salesChart'])->firstWhere('date', $today);
            $this->assertNotNull($point, 'chart harus memuat hari ini');
            $this->assertGreaterThanOrEqual(25000000, (float) $point['total']);
        } finally {
            Order::where('order_number', 'like', 'OFF-%')
                ->where('notes', 'like', 'Laku: TEST LAKU%')
                ->forceDelete();
            $test->forceDelete();
        }
    }
}
