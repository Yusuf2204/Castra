<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menus;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user()->loadMissing('role:id,role_name');

        return response()->json([
            'data' => [
                'total_users' => User::count(),
                'total_roles' => Roles::count(),
                'total_menus' => Menus::count(),
                'active_role' => $user->role?->role_name,
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }
}
