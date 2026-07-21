<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate(['email'=>['required','email','max:255'], 'password'=>['required','string','max:255']]);
        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are invalid.']]);
        }
        if (! $request->user()->is_admin) {
            Auth::logout();
            throw ValidationException::withMessages(['email' => ['Administrator access required.']]);
        }
        $request->session()->regenerate();
        return response()->json(['user' => $request->user(), 'csrf_token' => csrf_token()]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout(); $request->session()->invalidate(); $request->session()->regenerateToken();
        return response()->json(['message' => 'Logged out.', 'csrf_token' => csrf_token()]);
    }

    public function user(Request $request): JsonResponse { return response()->json(['user'=>$request->user()]); }
}
