<?php

namespace Database\Seeders;

use App\Models\Menus;
use App\Models\RoleMenus;
use App\Models\Roles;
use Illuminate\Database\Seeder;

class RoleMenuSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Roles::where('role_name', 'admin')->first();
        $user = Roles::where('role_name', 'user')->first();

        // ===== ADMIN → semua menu =====
        if ($admin) {
            $menus = Menus::all();
            RoleMenus::where('role_id', $admin->id)->delete();

            foreach ($menus as $menu) {
                RoleMenus::firstOrCreate([
                    'role_id' => $admin->id,
                    'menu_id' => $menu->id,
                ]);
            }
        }

        // ===== USER → modul finansial personal (tanpa Setup/Administrasi di sidebar) =====
        if ($user) {
            $userMenuPaths = [
                '/dashboard',
                '/incomes',
                '/expenses',
                '/reports',
                '/master',
                '/master/income-sources',
                '/master/categories',
                '/master/budget-groups',
                '/master/budget-periods',
            ];

            $userMenuIds = Menus::whereIn('menu_path', $userMenuPaths)->pluck('id')->all();

            // Sync menu permissions user
            RoleMenus::where('role_id', $user->id)->delete();
            foreach ($userMenuIds as $menuId) {
                RoleMenus::firstOrCreate([
                    'role_id' => $user->id,
                    'menu_id' => $menuId,
                ]);
            }
        }
    }
}
