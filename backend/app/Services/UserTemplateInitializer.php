<?php

namespace App\Services;

use App\Models\Account;
use App\Models\BudgetGroup;
use App\Models\BudgetPeriod;
use App\Models\Category;
use App\Models\IncomeSource;
use App\Models\User;
use Carbon\Carbon;

class UserTemplateInitializer
{
    /**
     * Initialize standard master templates (budget groups, income sources, categories, budget period, accounts)
     * for a given user. Fully idempotent.
     */
    public function initialize(User $user): void
    {
        $this->initAccounts($user);
        $this->initBudgetGroups($user);
        $this->initIncomeSources($user);
        $this->initCategories($user);
        $this->initBudgetPeriod($user);
    }

    protected function initAccounts(User $user): void
    {
        $defaultAccounts = [
            [
                'name' => 'Kas Kecil (Petty Cash)',
                'type' => 'petty_cash',
                'currency' => 'IDR',
                'initial_balance' => 0.00,
                'imprest_limit' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Kas Utama / Rekening Bank',
                'type' => 'bank',
                'currency' => 'IDR',
                'initial_balance' => 0.00,
                'imprest_limit' => null,
                'is_active' => true,
            ],
        ];

        foreach ($defaultAccounts as $acc) {
            Account::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'name' => $acc['name'],
                ],
                $acc
            );
        }
    }

    protected function initBudgetGroups(User $user): void
    {
        $defaultGroups = [
            [
                'code' => 'need',
                'name' => 'Need (Kebutuhan Pokok & Operasional)',
                'percentage' => 50.0,
                'sort_order' => 1,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'fun',
                'name' => 'Fun (Keinginan / Fleksibel)',
                'percentage' => 30.0,
                'sort_order' => 2,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'saving',
                'name' => 'Saving (Tabungan & Cadangan)',
                'percentage' => 20.0,
                'sort_order' => 3,
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'code' => 'emergency',
                'name' => 'Emergency (Dana Darurat)',
                'percentage' => 0.0,
                'sort_order' => 4,
                'is_system' => true,
                'is_active' => true,
            ],
        ];

        foreach ($defaultGroups as $group) {
            BudgetGroup::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'code' => $group['code'],
                ],
                $group
            );
        }
    }

    protected function initIncomeSources(User $user): void
    {
        $defaultSources = [
            [
                'name' => 'Kas Utama / Rekening Bank',
                'description' => 'Rekening bank operasional utama untuk sumber dana & kas',
                'is_active' => true,
            ],
            [
                'name' => 'Kas Kecil (Petty Cash)',
                'description' => 'Dana tunai kas kecil untuk kebutuhan rutin operasional',
                'is_active' => true,
            ],
            [
                'name' => 'Gaji',
                'description' => 'Penerimaan gaji / honor utama',
                'is_active' => true,
            ],
            [
                'name' => 'Dompet Tunai',
                'description' => 'Uang tunai fisik untuk kebutuhan belanja harian',
                'is_active' => true,
            ],
            [
                'name' => 'E-Wallet',
                'description' => 'Dompet digital (GoPay, OVO, ShopeePay, DANA)',
                'is_active' => true,
            ],
            [
                'name' => 'Pemasukan Lain-lain',
                'description' => 'Sumber penerimaan dana lainnya',
                'is_active' => true,
            ],
        ];

        foreach ($defaultSources as $source) {
            IncomeSource::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'name' => $source['name'],
                ],
                $source
            );
        }
    }

    protected function initCategories(User $user): void
    {
        $budgetGroups = BudgetGroup::where('user_id', $user->id)
            ->pluck('id', 'code')
            ->all();

        $needId = $budgetGroups['need'] ?? null;
        $funId = $budgetGroups['fun'] ?? null;
        $savingId = $budgetGroups['saving'] ?? null;
        $emergencyId = $budgetGroups['emergency'] ?? null;

        $categories = [
            // Expense Categories - Need / Operasional
            [
                'name' => 'Makan & Konsumsi',
                'type' => 'expense',
                'budget_group_id' => $needId,
                'monthly_estimate' => 1000000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Bensin & Transportasi',
                'type' => 'expense',
                'budget_group_id' => $needId,
                'monthly_estimate' => 300000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Belanja Operasional & ATK',
                'type' => 'expense',
                'budget_group_id' => $needId,
                'monthly_estimate' => 250000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Pengiriman & Kurir',
                'type' => 'expense',
                'budget_group_id' => $needId,
                'monthly_estimate' => 100000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Pemeliharaan & Kebersihan',
                'type' => 'expense',
                'budget_group_id' => $needId,
                'monthly_estimate' => 150000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Kuota & Internet',
                'type' => 'expense',
                'budget_group_id' => $needId,
                'monthly_estimate' => 100000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Biaya Operasional Lainnya',
                'type' => 'expense',
                'budget_group_id' => $needId,
                'monthly_estimate' => 100000.00,
                'is_active' => true,
            ],

            // Expense Categories - Fun / Fleksibel
            [
                'name' => 'Makan di Luar & Kopi',
                'type' => 'expense',
                'budget_group_id' => $funId,
                'monthly_estimate' => 300000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Hiburan & Santai',
                'type' => 'expense',
                'budget_group_id' => $funId,
                'monthly_estimate' => 200000.00,
                'is_active' => true,
            ],

            // Expense Categories - Saving & Emergency
            [
                'name' => 'Tabungan & Investasi',
                'type' => 'expense',
                'budget_group_id' => $savingId,
                'monthly_estimate' => 500000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Dana Darurat',
                'type' => 'expense',
                'budget_group_id' => $emergencyId,
                'monthly_estimate' => 0.00,
                'is_active' => true,
            ],

            // Income Categories
            [
                'name' => 'Pengisian Kas (Top Up)',
                'type' => 'income',
                'budget_group_id' => null,
                'monthly_estimate' => 0.00,
                'is_active' => true,
            ],
            [
                'name' => 'Gaji Pokok',
                'type' => 'income',
                'budget_group_id' => null,
                'monthly_estimate' => 4000000.00,
                'is_active' => true,
            ],
            [
                'name' => 'Bonus & Insentif',
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
            Category::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'type' => $cat['type'],
                    'name' => $cat['name'],
                ],
                $cat
            );
        }
    }

    protected function initBudgetPeriod(User $user): void
    {
        $hasPeriod = BudgetPeriod::where('user_id', $user->id)->exists();
        if ($hasPeriod) {
            return;
        }

        $now = Carbon::now();
        BudgetPeriod::create([
            'user_id' => $user->id,
            'name' => 'Periode '.$now->translatedFormat('F Y'),
            'start_date' => $now->copy()->startOfMonth()->toDateString(),
            'end_date' => $now->copy()->endOfMonth()->toDateString(),
            'total_income_allocated' => 0,
            'is_active' => true,
        ]);
    }
}
