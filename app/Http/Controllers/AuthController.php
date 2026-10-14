<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\PostPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'username' => ['required', 'string', 'min:3', 'max:24', 'regex:/^[A-Za-z0-9_]+$/', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ]);

        $data['username'] = Str::lower($data['username']);
        $user = User::create($data);
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['Those sign in details did not match an account.'],
            ]);
        }

        if (! $request->user()->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['This account is currently unavailable.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'ok' => true,
            'csrfToken' => csrf_token(),
        ]);
    }

    private function userPayload(User $user): array
    {
        return array_merge(PostPresenter::userSummary($user), ['email' => $user->email]);
    }
}
