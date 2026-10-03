<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductDetailResource;
use App\Models\Brand;
use App\Models\Category;
use App\Services\CatalogService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function __construct(private CatalogService $catalog) {}

    public function products(Request $request)
    {
        $paginator = $this->catalog->paginate($request->query());

        return ApiResponse::paginated(
            $paginator->setCollection(
                ProductCardResource::collection($paginator->getCollection())->collection
            )
        );
    }

    public function product(string $key)
    {
        $product = $this->catalog->findBySlugOrId($key);

        return ApiResponse::ok([
            'product' => new ProductDetailResource($product),
            'related' => ProductCardResource::collection($this->catalog->related($product)),
        ]);
    }

    public function categories()
    {
        $data = Category::where('is_active', true)
            ->withCount(['products' => fn ($q) => $q->active()])
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::ok(CategoryResource::collection($data));
    }

    public function brands()
    {
        $data = Brand::where('is_active', true)
            ->withCount(['products' => fn ($q) => $q->active()])
            ->orderBy('name')
            ->get();

        return ApiResponse::ok(BrandResource::collection($data));
    }

    public function searchSuggest(Request $request)
    {
        $request->validate(['q' => 'required|string|min:2|max:100']);
        $items = $this->catalog->suggestions($request->query('q'));

        return ApiResponse::ok(ProductCardResource::collection($items));
    }

    public function home()
    {
        $featured = \App\Models\Product::active()->featured()->with(['category', 'brand', 'images'])->limit(8)->get();
        $flash = \App\Models\Product::active()->where('is_flash_sale', true)->with(['category', 'brand', 'images'])->limit(8)->get();
        $new = \App\Models\Product::active()->where('is_new', true)->with(['category', 'brand', 'images'])->latest()->limit(8)->get();
        $best = \App\Models\Product::active()->with(['category', 'brand', 'images'])->orderByDesc('sold_count')->limit(8)->get();

        return ApiResponse::ok([
            'featured' => ProductCardResource::collection($featured),
            'flash_sale' => ProductCardResource::collection($flash),
            'new_arrivals' => ProductCardResource::collection($new),
            'best_sellers' => ProductCardResource::collection($best),
        ]);
    }
}
