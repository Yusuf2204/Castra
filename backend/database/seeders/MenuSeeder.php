<?php

namespace Database\Seeders;

use App\Models\Menus;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Idempotent per menu item (keyed by the unique `menu_path` column) so
     * this seeder can be re-run safely and will still pick up newly added
     * menus on a database that has already been seeded before.
     */
    public function run(): void
    {
        $dashboard = Menus::firstOrCreate(
            ['menu_path' => '/dashboard'],
            [
                'menu_name' => 'Dashboard',
                'menu_icon' => 'cilHamburgerMenu',
                'menu_parent_id' => null,
                'menu_order' => 0,
            ]
        );

        $setup = Menus::firstOrCreate(
            ['menu_path' => '/setup'],
            [
                'menu_name' => 'Setup',
                'menu_icon' => 'cilSettings',
                'menu_parent_id' => null,
                'menu_order' => 1,
            ]
        );

        $setupChildren = [
            ['menu_name' => 'Company', 'menu_path' => '/setup/company', 'menu_order' => 1],
            ['menu_name' => 'Users', 'menu_path' => '/setup/users', 'menu_order' => 2],
            ['menu_name' => 'Roles', 'menu_path' => '/setup/roles', 'menu_order' => 3],
            ['menu_name' => 'Menus', 'menu_path' => '/setup/menus', 'menu_order' => 4],
            ['menu_name' => 'Role Permissions', 'menu_path' => '/setup/role-permissions', 'menu_order' => 5],
            ['menu_name' => 'Change Password', 'menu_path' => '/setup/change-password', 'menu_order' => 6],
        ];

        foreach ($setupChildren as $child) {
            Menus::firstOrCreate(
                ['menu_path' => $child['menu_path']],
                [
                    'menu_name' => $child['menu_name'],
                    'menu_parent_id' => $setup->id,
                    'menu_order' => $child['menu_order'],
                ]
            );
        }

        // Master group (financial masters live here, e.g. Sumber Dana)
        $master = Menus::firstOrCreate(
            ['menu_path' => '/master'],
            [
                'menu_name' => 'Master',
                'menu_icon' => 'cilSettings',
                'menu_parent_id' => null,
                'menu_order' => 2,
            ]
        );

        Menus::firstOrCreate(
            ['menu_path' => '/master/income-sources'],
            [
                'menu_name' => 'Sumber Dana',
                'menu_parent_id' => $master->id,
                'menu_order' => 1,
            ]
        );
    }
}
