<?php

namespace Database\Seeders;

use App\Models\Roles;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Roles::firstOrCreate(['role_name' => 'admin']);
        Roles::firstOrCreate(['role_name' => 'user']);
    }
}
