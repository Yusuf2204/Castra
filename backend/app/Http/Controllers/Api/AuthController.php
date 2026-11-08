<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\NavigationService;
use App\Services\UserTemplateInitializer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        private readonly NavigationService $navigation,
        private readonly UserTemplateInitializer $templateInitializer
    ) {}

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'data' => null,
                'message' => 'Invalid credentials',
                'errors' => ['auth' => ['Email or password incorrect']],
            ], 401);
        }

        $user = $request->user();

        // Ensure user has base financial templates if newly created or empty
        if ($user->categories()->count() === 0) {
            $this->templateInitializer->initialize($user);
        }

        // Keep one active API token per user.
        $user->tokens()->delete();

        $expiresAt = config('sanctum.expiration')
            ? now()->addMinutes((int) config('sanctum.expiration'))
            : null;

        $accessToken = $user->createToken('cms-token', ['cms:access'], $expiresAt);

        return response()->json([
            'data' => [
                'token' => $accessToken->plainTextToken,
                'user' => $user,
                'company' => Company::first(),
                'navigation' => $this->navigation->forRole($user->role_id),
            ],
            'message' => 'Login successful',
            'errors' => null,
        ]);
    }

    public function me(Request $request)
    {
        $data = [
            'user' => $request->user(),
            'company' => Company::first(),
            'navigation' => $this->navigation->forRole($request->user()->role_id),
        ];

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'data' => null,
            'message' => 'Logged out',
            'errors' => null,
        ]);
    }
}
