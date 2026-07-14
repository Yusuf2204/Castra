<?php

namespace Database\Seeders;

use App\Models\Roles;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        $name = env('ADMIN_NAME', 'Administrator');

        if (! $email || ! $password) {
            $this->command?->warn('Admin user skipped: ADMIN_EMAIL and ADMIN_PASSWORD are required.');

            return;
        }

        if (strlen($password) < 12) {
            throw new RuntimeException('ADMIN_PASSWORD must contain at least 12 characters.');
        }

        $adminRole = Roles::where('role_name', 'admin')->first();

        if (! $adminRole) {
            throw new RuntimeException('Admin role not found. Run RoleSeeder before AdminUserSeeder.');
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role_id' => $adminRole->id,
            ]
        );
    }
}
