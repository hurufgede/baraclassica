<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'brand' => 'required|in:Apple,Samsung,Xiaomi,OPPO,Realme,Vivo',
            'storage' => 'required|string|max:20',
            'ram' => 'required|string|max:20',
            'price' => 'required|integer|min:1000',
            'condition' => 'required|in:Baru,Bekas',
            'image' => 'required|url|max:1000',
            'stock' => 'required|integer|min:0|max:1000',
            'featured' => 'nullable|boolean',
            'description' => 'nullable|string|max:2000',
        ]);
        $data['location'] = 'Kediri';
        $data['seller'] = 'DannBakoell';
        $data['featured'] = (bool) ($data['featured'] ?? false);
        return response()->json(Product::create($data), 201);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'brand' => 'sometimes|in:Apple,Samsung,Xiaomi,OPPO,Realme,Vivo',
            'storage' => 'sometimes|string|max:20',
            'ram' => 'sometimes|string|max:20',
            'price' => 'sometimes|integer|min:1000',
            'condition' => 'sometimes|in:Baru,Bekas',
            'image' => 'sometimes|url|max:1000',
            'stock' => 'sometimes|integer|min:0|max:1000',
            'featured' => 'sometimes|boolean',
            'description' => 'nullable|string|max:2000',
        ]);
        $product->update($data);
        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['ok' => true]);
    }
}
