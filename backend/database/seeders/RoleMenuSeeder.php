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
        $menus = Menus::all();

        foreach ($menus as $menu) {
            RoleMenus::firstOrCreate([
                'role_id' => $admin->id,
                'menu_id' => $menu->id,
            ]);
        }

        // ===== USER → limited but structural =====

        // wajib ada dashboard
        $dashboard = Menus::where('menu_path', '/dashboard')->first();

        // parent setup
        $setup = Menus::where('menu_path', '/setup')->first();

        // child permission
        $changePassword = Menus::where('menu_path', '/setup/change-password')->first();

        // master & transaksi
        $master = Menus::where('menu_path', '/master')->first();
        $incomeSources = Menus::where('menu_path', '/master/income-sources')->first();
        $categories = Menus::where('menu_path', '/master/categories')->first();
        $budgetGroups = Menus::where('menu_path', '/master/budget-groups')->first();
        $incomes = Menus::where('menu_path', '/incomes')->first();
        $expenses = Menus::where('menu_path', '/expenses')->first();
        $reports = Menus::where('menu_path', '/reports')->first();

        $userMenus = [
            $dashboard,
            $master,
            $incomeSources,
            $categories,
            $budgetGroups,
            $incomes,
            $expenses,
            $reports,
            $setup,
            $changePassword,
        ];

        foreach ($userMenus as $menu) {
            if (! $menu) {
                continue;
            }

            RoleMenus::firstOrCreate([
                'role_id' => $user->id,
                'menu_id' => $menu->id,
            ]);
        }
    }
}
