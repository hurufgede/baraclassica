<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        return ApiResponse::ok($request->user()->addresses()->orderByDesc('is_default')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'label' => 'nullable|string|max:50',
            'recipient_name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
            'address_line' => 'required|string',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'required|string|max:10',
            'notes' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);
        $data['user_id'] = $request->user()->id;

        if (! empty($data['is_default'])) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address = $request->user()->addresses()->create($data);

        return ApiResponse::created($address, 'Alamat ditambahkan.');
    }

    public function update(Request $request, string $id)
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $data = $request->validate([
            'label' => 'nullable|string|max:50',
            'recipient_name' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:30',
            'address_line' => 'sometimes|string',
            'city' => 'sometimes|string|max:100',
            'province' => 'sometimes|string|max:100',
            'postal_code' => 'sometimes|string|max:10',
            'notes' => 'nullable|string|max:500',
            'is_default' => 'boolean',
        ]);

        if (! empty($data['is_default'])) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address->update($data);

        return ApiResponse::ok($address->fresh(), 'Alamat diperbarui.');
    }

    public function destroy(Request $request, string $id)
    {
        $request->user()->addresses()->findOrFail($id)->delete();

        return ApiResponse::ok(null, 'Alamat dihapus.');
    }
}
