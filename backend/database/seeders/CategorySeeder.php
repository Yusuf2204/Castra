<?php

namespace Database\Seeders;

use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds categories based on reference sheet (Keuangan_September_2026.xlsx)
     * with exact monthly estimates and budget group mappings.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // Mapping budget groups untuk user ini
            $budgetGroups = BudgetGroup::where('user_id', $user->id)
                ->pluck('id', 'code')
                ->all();

            $needId = $budgetGroups['need'] ?? null;
            $funId = $budgetGroups['fun'] ?? null;
            $savingId = $budgetGroups['saving'] ?? null;
            $emergencyId = $budgetGroups['emergency'] ?? null;

            $categories = [
                // === PENGELUARAN (EXPENSE) DARI SHEET ===
                // 1. Need (50%)
                [
                    'name' => 'Makan',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 1240000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Bensin',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 250000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Kuota',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 100000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'BPJS',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 150000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Laundry',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 100000.00,
                    'is_active' => true,
                ],

                // 2. Fun (30%)
                [
                    'name' => 'Skincare',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 200000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Jajan',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 300000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Lainnya',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 500000.00,
                    'is_active' => true,
                ],

                // 3. Saving (20%)
                [
                    'name' => 'Tabungan Rutin',
                    'type' => 'expense',
                    'budget_group_id' => $savingId,
                    'monthly_estimate' => 790272.00,
                    'is_active' => true,
                ],

                // 4. Emergency
                [
                    'name' => 'Dana Darurat',
                    'type' => 'expense',
                    'budget_group_id' => $emergencyId,
                    'monthly_estimate' => 337089.60,
                    'is_active' => true,
                ],

                // === PEMASUKAN (INCOME) ===
                [
                    'name' => 'Gaji Pokok',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 3971362.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Bonus & Tunjangan',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 0.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Pemasukan Lainnya',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 0.00,
                    'is_active' => true,
                ],
            ];

            foreach ($categories as $cat) {
                Category::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'type' => $cat['type'],
                        'name' => $cat['name'],
                    ],
                    [
                        'budget_group_id' => $cat['budget_group_id'],
                        'monthly_estimate' => $cat['monthly_estimate'],
                        'is_active' => $cat['is_active'],
                    ]
                );
            }
        }
    }
}

