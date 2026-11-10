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
     * Seeds simplified, clear, non-redundant categories for expenses and incomes
     * aligned with 50/30/20 budgeting.
     */
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $budgetGroups = BudgetGroup::where('user_id', $user->id)
                ->pluck('id', 'code')
                ->all();

            $needId = $budgetGroups['need'] ?? null;
            $funId = $budgetGroups['fun'] ?? null;
            $savingId = $budgetGroups['saving'] ?? null;
            $emergencyId = $budgetGroups['emergency'] ?? null;

            $categories = [
                // === PENGELUARAN (EXPENSE) ===
                // 1. Need (50%) - Kebutuhan Pokok Esensial
                [
                    'name' => 'Makanan & Minuman',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 1240000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Transportasi & Bensin',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 300000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Tagihan & Utilitas',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 250000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Kebutuhan Rumah Tangga & Operasional',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 200000.00,
                    'is_active' => true,
                ],

                // 2. Fun (30%) - Gaya Hidup & Rekreasi
                [
                    'name' => 'Jajan & Kuliner',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 300000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Belanja & Hiburan',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 400000.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Perawatan Diri & Skincare',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 250000.00,
                    'is_active' => true,
                ],

                // 3. Cadangan / Emergency
                [
                    'name' => 'Pengeluaran Lainnya & Tak Terduga',
                    'type' => 'expense',
                    'budget_group_id' => $emergencyId ?: $funId,
                    'monthly_estimate' => 500000.00,
                    'is_active' => true,
                ],

                // 4. Saving
                [
                    'name' => 'Tabungan & Investasi',
                    'type' => 'expense',
                    'budget_group_id' => $savingId ?: $needId,
                    'monthly_estimate' => 790272.00,
                    'is_active' => true,
                ],

                // === PEMASUKAN (INCOME) ===
                [
                    'name' => 'Gaji Pokok',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 4000000.00,
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
                    'name' => 'Usaha & Freelance',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 0.00,
                    'is_active' => true,
                ],
                [
                    'name' => 'Hasil Investasi',
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
