<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menus;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Menus::with('parent')->orderBy('menu_order')->get(),
            'message' => 'OK',
            'errors' => null
        ]);
    }

    public function store(Request $request)
    {
        $menu = Menus::create($request->all());

        return response()->json([
            'data' => $menu,
            'message' => 'Created',
            'errors' => null
        ]);
    }

    public function show($id)
    {
        return response()->json([
            'data' => Menus::with('parent')->findOrFail($id),
            'message' => 'OK',
            'errors' => null
        ]);
    }

    public function update(Request $request, $id)
    {
        $menu = Menus::findOrFail($id);
        $menu->update($request->all());

        return response()->json([
            'data' => $menu,
            'message' => 'Updated',
            'errors' => null
        ]);
    }

    public function destroy($id)
    {
        $menu = Menus::findOrFail($id);
        $menu->delete();

        return response()->json([
            'data' => true,
            'message' => 'Deleted',
            'errors' => null
        ]);
    }

    public function tree()
    {
        $menus = Menus::whereNull('menu_parent_id')
            ->with('children.children')
            ->orderBy('menu_order')
            ->get();

        return response()->json([
            'data' => $menus,
            'message' => 'OK',
            'errors' => null
        ]);
    }
}
