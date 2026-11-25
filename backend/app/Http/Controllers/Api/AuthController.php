<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Roles;
use App\Models\User;
use App\Services\NavigationService;
use App\Services\UserTemplateInitializer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private readonly NavigationService $navigation,
        private readonly UserTemplateInitializer $templateInitializer
    ) {}

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Alamat email sudah terdaftar. Silakan login atau gunakan email lain.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal terdiri dari 6 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        // Default role for new users is 'user'
        $userRole = Roles::where('role_name', 'user')->first();
        if (! $userRole) {
            $userRole = Roles::create(['role_name' => 'user']);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $userRole->id,
        ]);

        // Initialize standard financial master templates for the new user
        $this->templateInitializer->initialize($user);

        // Auto-login: issue access token
        $expiresAt = config('sanctum.expiration')
            ? now()->addMinutes((int) config('sanctum.expiration'))
            : null;

        $accessToken = $user->createToken('cms-token', ['cms:access'], $expiresAt);

        return response()->json([
            'data' => [
                'token' => $accessToken->plainTextToken,
                'user' => $user->load('role'),
                'company' => Company::first(),
                'navigation' => $this->navigation->forRole($user->role_id),
            ],
            'message' => 'Registrasi akun berhasil!',
            'errors' => null,
        ], 201);
    }

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
