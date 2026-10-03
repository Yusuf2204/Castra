<?php

namespace Database\Seeders;

use App\Models\BudgetGroup;
use App\Models\User;
use Illuminate\Database\Seeder;

class BudgetGroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds standard financial envelope budget groups (Need, Fun, Saving, Emergency)
     * for users.
     */
    public function run(): void
    {
        $defaultGroups = [
            [
                'code' => 'need',
                'name' => 'Need (Kebutuhan Pokok)',
                'percentage' => 50.0,
                'sort_order' => 1,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'fun',
                'name' => 'Fun (Keinginan / Gaya Hidup)',
                'percentage' => 30.0,
                'sort_order' => 2,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'saving',
                'name' => 'Saving (Tabungan & Investasi)',
                'percentage' => 20.0,
                'sort_order' => 3,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'emergency',
                'name' => 'Emergency (Dana Darurat / Cadangan)',
                'percentage' => 0.0,
                'sort_order' => 4,
                'is_system' => true,
                'is_active' => true,
            ],
        ];

        $users = User::all();

        foreach ($users as $user) {
            foreach ($defaultGroups as $group) {
                BudgetGroup::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'code' => $group['code'],
                    ],
                    [
                        'name' => $group['name'],
                        'percentage' => $group['percentage'],
                        'sort_order' => $group['sort_order'],
                        'is_system' => $group['is_system'],
                        'is_active' => $group['is_active'],
                    ]
                );
            }
        }
    }
}
