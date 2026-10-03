<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    public function index() { return ApiResponse::ok(Category::orderBy('sort_order')->get()); }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);
        $data['slug'] = Str::slug($data['name']).'-'.Str::lower(Str::random(4));
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        return ApiResponse::created(Category::create($data), 'Kategori dibuat.');
    }

    public function show(string $id) { return ApiResponse::ok(Category::findOrFail($id)); }

    public function update(Request $request, string $id)
    {
        $cat = Category::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $cat->update($data);

        return ApiResponse::ok($cat->fresh(), 'Kategori diperbarui.');
    }

    public function destroy(string $id)
    {
        Category::findOrFail($id)->delete();

        return ApiResponse::ok(null, 'Kategori dihapus.');
    }
}
