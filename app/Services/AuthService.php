<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $token = $user->createToken('web')->plainTextToken;

        return [$user, $token];
    }

    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages(['email' => 'Email atau password salah.']);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages(['email' => 'Akun dinonaktifkan.']);
        }

        $token = $user->createToken('web')->plainTextToken;

        return [$user, $token];
    }
}
