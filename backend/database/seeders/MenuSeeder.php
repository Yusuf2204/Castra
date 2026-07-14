<?php

namespace Database\Seeders;

use App\Models\Menus;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dashboard = Menus::create([
            'menu_name' => 'Dashboard',
            'menu_path' => '/dashboard',
            'menu_icon' => 'cilHamburgerMenu',
            'menu_parent_id' => null,
            'menu_order' => 0
        ]);

        $setup = Menus::create([
            'menu_name' => 'Setup',
            'menu_path' => '/setup',
            'menu_icon' => 'cilSettings',
            'menu_parent_id' => null,
            'menu_order' => 1
        ]);

        Menus::insert([
            ['menu_name'=>'Company','menu_path'=>'/setup/company','menu_parent_id'=>$setup->id,'menu_order'=>1],
            ['menu_name'=>'Users','menu_path'=>'/setup/users','menu_parent_id'=>$setup->id,'menu_order'=>2],
            ['menu_name'=>'Roles','menu_path'=>'/setup/roles','menu_parent_id'=>$setup->id,'menu_order'=>3],
            ['menu_name'=>'Menus','menu_path'=>'/setup/menus','menu_parent_id'=>$setup->id,'menu_order'=>4],
            ['menu_name'=>'Role Permissions','menu_path'=>'/setup/role-permissions','menu_parent_id'=>$setup->id,'menu_order'=>5],
            ['menu_name'=>'Change Password','menu_path'=>'/setup/change-password','menu_parent_id'=>$setup->id,'menu_order'=>6],
        ]);
    }
}
