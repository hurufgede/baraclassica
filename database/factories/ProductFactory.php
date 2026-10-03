<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = $this->faker->words(3, true);
        $price = $this->faker->numberBetween(50000, 5000000);
        $hasDiscount = $this->faker->boolean(30);

        return [
            'category_id' => Category::factory(),
            'brand_id' => Brand::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'sku' => 'SKU-'.strtoupper(Str::random(8)),
            'short_description' => $this->faker->sentence(),
            'description' => $this->faker->paragraphs(3, true),
            'specifications' => ['Berat' => '500g', 'Garansi' => '1 tahun'],
            'price' => $price,
            'compare_price' => $hasDiscount ? $price * 1.25 : null,
            'stock' => $this->faker->numberBetween(0, 100),
            'sold_count' => $this->faker->numberBetween(0, 1000),
            'status' => 'active',
            'is_featured' => $this->faker->boolean(20),
            'is_flash_sale' => $this->faker->boolean(15),
            'is_new' => $this->faker->boolean(25),
            'rating_avg' => $this->faker->randomFloat(2, 3.5, 5),
            'rating_count' => $this->faker->numberBetween(0, 500),
        ];
    }
}
