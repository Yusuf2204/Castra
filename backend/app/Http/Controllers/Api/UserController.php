<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index() {
        return response()->json([
            'data' => User::with('role')->get(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request) {
        $data = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role_id'  => 'required|exists:roles,id',
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json([
            'data' => $user,
            'message' => 'User created',
            'errors' => null,
        ], 201);
    }

    public function show($id) {
        return response()->json([
            'data' => User::with('role')->findOrFail($id),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, $id) {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:6',
            'role_id'  => 'nullable|exists:roles,id',
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json([
            'data' => $user,
            'message' => 'User updated',
            'errors' => null,
        ]);
    }

    public function destroy($id) {
        User::findOrFail($id)->delete();

        return response()->json([
            'data' => null,
            'message' => 'User deleted',
            'errors' => null,
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6',
            'confirm_password' => 'required|same:new_password',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'data' => null,
                'message' => 'Current password is incorrect',
                'errors' => ['current_password' => 'Wrong password'],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'data' => true,
            'message' => 'Password updated',
            'errors' => null,
        ]);
    }
}
