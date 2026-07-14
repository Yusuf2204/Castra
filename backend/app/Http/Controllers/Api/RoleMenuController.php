<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoleMenus;
use App\Models\Roles;
use App\Services\NavigationService;
use Illuminate\Http\Request;

class RoleMenuController extends Controller
{
    public function __construct(private readonly NavigationService $navigation) {}

    public function show($roleId)
    {
        Roles::findOrFail($roleId);

        return response()->json([
            'data' => $this->navigation->forRole((int) $roleId),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request, $roleId)
    {
        Roles::findOrFail($roleId);

        $data = $request->validate([
            'menu_ids' => 'nullable|array',
            'menu_ids.*' => 'integer|exists:menus,id',
        ]);

        RoleMenus::where('role_id', $roleId)->delete();

        foreach ($data['menu_ids'] ?? [] as $menuId) {
            RoleMenus::create([
                'role_id' => $roleId,
                'menu_id' => $menuId,
            ]);
        }

        return response()->json([
            'data' => true,
            'message' => 'Permissions updated',
            'errors' => null,
        ]);
    }
}
