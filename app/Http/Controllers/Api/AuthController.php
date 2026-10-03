<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $auth) {}

    public function register(RegisterRequest $request)
    {
        [$user, $token] = $this->auth->register($request->validated());

        return ApiResponse::created([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Registrasi berhasil.');
    }

    public function login(LoginRequest $request)
    {
        [$user, $token] = $this->auth->login(
            $request->validated()['email'],
            $request->validated()['password']
        );

        return ApiResponse::ok([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Login berhasil.');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return ApiResponse::ok(null, 'Logout berhasil.');
    }

    public function user(Request $request)
    {
        return ApiResponse::ok(new UserResource($request->user()), 'OK');
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:30',
        ]);

        $request->user()->update($data);

        return ApiResponse::ok(new UserResource($request->user()->fresh()), 'Profil diperbarui.');
    }
}
