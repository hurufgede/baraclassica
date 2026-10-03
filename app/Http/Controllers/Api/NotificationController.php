<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notes = $request->user()->notifications()->latest()->paginate(15);

        return ApiResponse::paginated($notes);
    }

    public function read(Request $request, string $id)
    {
        $note = $request->user()->notifications()->findOrFail($id);
        $note->markAsRead();

        return ApiResponse::ok(null, 'Ditandai dibaca.');
    }
}
