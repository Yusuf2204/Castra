<?php

namespace App\Services;

use App\Models\Menus;
use App\Models\Roles;

class NavigationService
{
    public function forRole(?int $roleId): array
    {
        if (! $roleId) {
            return [];
        }

        $role = Roles::with('menus:id')->find($roleId);

        if (! $role) {
            return [];
        }

        $allowedIds = $role->menus->pluck('id')->all();
        $menus = Menus::orderBy('menu_order')->get()->toArray();

        return $this->buildTree($menus, $allowedIds);
    }

    private function buildTree(array $menus, array $allowedIds, ?int $parentId = null): array
    {
        return collect($menus)
            ->filter(fn (array $menu) => $this->parentMatches($menu['menu_parent_id'], $parentId))
            ->map(function (array $menu) use ($menus, $allowedIds) {
                return [
                    'id' => $menu['id'],
                    'menu_name' => $menu['menu_name'],
                    'menu_path' => $menu['menu_path'],
                    'menu_icon' => $menu['menu_icon'],
                    'menu_parent_id' => $menu['menu_parent_id'],
                    'menu_order' => $menu['menu_order'],
                    'checked' => in_array($menu['id'], $allowedIds, true),
                    'children' => $this->buildTree($menus, $allowedIds, (int) $menu['id']),
                ];
            })
            ->values()
            ->all();
    }

    private function parentMatches(mixed $menuParentId, ?int $parentId): bool
    {
        return $parentId === null
            ? $menuParentId === null
            : (int) $menuParentId === $parentId;
    }
}
