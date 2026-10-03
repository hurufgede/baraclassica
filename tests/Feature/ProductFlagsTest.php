<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Tests\TestCase;

class ProductFlagsTest extends TestCase
{
    public function test_admin_can_flag_product_for_jelajahi_filters(): void
    {
        $admin = User::where('is_admin', true)->first();
        $this->assertNotNull($admin);

        $p = Product::first();
        $this->assertNotNull($p);
        $orig = $p->only(['is_featured', 'is_new', 'is_booked']);

        try {
            $res = $this->actingAs($admin, 'sanctum')
                ->putJson("/api/admin/admin-products/{$p->id}", [
                    'is_featured' => true, 'is_new' => true, 'is_booked' => true,
                ]);
            $res->assertOk();

            $p->refresh();
            $this->assertTrue((bool) $p->is_featured);
            $this->assertTrue((bool) $p->is_new);
            $this->assertTrue((bool) $p->is_booked);

            foreach (['is_featured' => 1, 'is_new' => 1, 'is_booked' => 1] as $param => $v) {
                $list = $this->getJson("/api/products?{$param}={$v}&per_page=48");
                $list->assertOk();
                $ids = collect($list->json('data'))->pluck('id')->all();
                $this->assertContains($p->id, $ids, "filter {$param} harus memuat produk");
                $flags = collect($list->json('data'))->firstWhere('id', $p->id);
                $this->assertTrue((bool) $flags[$param]);
            }
        } finally {
            $p->update($orig);
        }
    }
}
