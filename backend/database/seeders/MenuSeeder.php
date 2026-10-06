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
     * this seeder can be re-run safely and will update menu order, icon, and parent
     * on an existing database.
     */
    public function run(): void
    {
        // 1. Dashboard
        Menus::updateOrCreate(
            ['menu_path' => '/dashboard'],
            [
                'menu_name' => 'Dashboard',
                'menu_icon' => 'cilSpeedometer',
                'menu_parent_id' => null,
                'menu_order' => 1,
            ]
        );

        // 2. Pemasukan (Incomes)
        Menus::updateOrCreate(
            ['menu_path' => '/incomes'],
            [
                'menu_name' => 'Pemasukan',
                'menu_icon' => 'cilArrowTop',
                'menu_parent_id' => null,
                'menu_order' => 2,
            ]
        );

        // 3. Pengeluaran (Expenses)
        Menus::updateOrCreate(
            ['menu_path' => '/expenses'],
            [
                'menu_name' => 'Pengeluaran',
                'menu_icon' => 'cilArrowBottom',
                'menu_parent_id' => null,
                'menu_order' => 3,
            ]
        );

        // 4. Laporan (Reports)
        Menus::updateOrCreate(
            ['menu_path' => '/reports'],
            [
                'menu_name' => 'Laporan',
                'menu_icon' => 'cilChartPie',
                'menu_parent_id' => null,
                'menu_order' => 4,
            ]
        );

        // 5. Master Data (Financial master data dropdown)
        $master = Menus::updateOrCreate(
            ['menu_path' => '/master'],
            [
                'menu_name' => 'Master Data',
                'menu_icon' => 'cilLayers',
                'menu_parent_id' => null,
                'menu_order' => 5,
            ]
        );

        Menus::updateOrCreate(
            ['menu_path' => '/master/income-sources'],
            [
                'menu_name' => 'Sumber Dana',
                'menu_parent_id' => $master->id,
                'menu_order' => 1,
            ]
        );

        Menus::updateOrCreate(
            ['menu_path' => '/master/categories'],
            [
                'menu_name' => 'Kategori',
                'menu_parent_id' => $master->id,
                'menu_order' => 2,
            ]
        );

        Menus::updateOrCreate(
            ['menu_path' => '/master/budget-groups'],
            [
                'menu_name' => 'Alokasi Anggaran',
                'menu_parent_id' => $master->id,
                'menu_order' => 3,
            ]
        );

        // 6. Setup (System & Administration dropdown - Admin Only)
        $setup = Menus::updateOrCreate(
            ['menu_path' => '/setup'],
            [
                'menu_name' => 'Setup',
                'menu_icon' => 'cilSettings',
                'menu_parent_id' => null,
                'menu_order' => 6,
            ]
        );

        $setupChildren = [
            ['menu_name' => 'Users', 'menu_path' => '/setup/users', 'menu_order' => 1],
            ['menu_name' => 'Roles', 'menu_path' => '/setup/roles', 'menu_order' => 2],
            ['menu_name' => 'Role Permissions', 'menu_path' => '/setup/role-permissions', 'menu_order' => 3],
            ['menu_name' => 'Menus', 'menu_path' => '/setup/menus', 'menu_order' => 4],
            ['menu_name' => 'Company', 'menu_path' => '/setup/company', 'menu_order' => 5],
            ['menu_name' => 'Change Password', 'menu_path' => '/setup/change-password', 'menu_order' => 6],
        ];

        foreach ($setupChildren as $child) {
            Menus::updateOrCreate(
                ['menu_path' => $child['menu_path']],
                [
                    'menu_name' => $child['menu_name'],
                    'menu_parent_id' => $setup->id,
                    'menu_order' => $child['menu_order'],
                ]
            );
        }
    }
}
