<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Roles;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Roles::all(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'role_name' => 'required|string|unique:roles,role_name',
        ]);

        $role = Roles::create($data);

        return response()->json([
            'data' => $role,
            'message' => 'Roles created',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $role = Roles::findOrFail($id);

        $data = $request->validate([
            'role_name' => 'required|string|unique:roles,role_name,' . $id,
        ]);

        $role->update($data);

        return response()->json([
            'data' => $role,
            'message' => 'Role updated',
            'errors' => null,
        ]);
    }

    public function destroy($id)
    {
        Roles::findOrFail($id)->delete();

        return response()->json([
            'data' => null,
            'message' => 'Role deleted',
            'errors' => null,
        ]);
    }
}
