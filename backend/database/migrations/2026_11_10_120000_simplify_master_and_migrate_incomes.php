<?php

use App\Models\Account;
use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Simplifies master data, makes income_source_id nullable on in_transactions,
     * seeds standard clean categories (Need, Fun, Emergency, Income),
     * and safely backfills existing in_transactions category_id and account_id.
     */
    public function up(): void
    {
        // 1. Allow income_source_id to be nullable so transactions rely on category_id & account_id
        Schema::table('in_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('income_source_id')->nullable()->change();
        });

        // 2. Data Migration: For all users, ensure clean standard categories exist
        $users = User::all();
        foreach ($users as $user) {
            $budgetGroups = BudgetGroup::where('user_id', $user->id)->pluck('id', 'code')->all();
            $needId = $budgetGroups['need'] ?? null;
            $funId = $budgetGroups['fun'] ?? null;
            $emergencyId = $budgetGroups['emergency'] ?? null;

            $standardCategories = [
                // EXPENSES - Need (50%)
                ['name' => 'Makanan & Minuman', 'type' => 'expense', 'budget_group_id' => $needId, 'monthly_estimate' => 1200000.00],
                ['name' => 'Transportasi & Kendaraan', 'type' => 'expense', 'budget_group_id' => $needId, 'monthly_estimate' => 300000.00],
                ['name' => 'Tagihan & Utilitas', 'type' => 'expense', 'budget_group_id' => $needId, 'monthly_estimate' => 250000.00],
                ['name' => 'Kebutuhan Rumah Tangga', 'type' => 'expense', 'budget_group_id' => $needId, 'monthly_estimate' => 200000.00],

                // EXPENSES - Fun (30%)
                ['name' => 'Jajan & Kuliner', 'type' => 'expense', 'budget_group_id' => $funId, 'monthly_estimate' => 300000.00],
                ['name' => 'Belanja & Hiburan', 'type' => 'expense', 'budget_group_id' => $funId, 'monthly_estimate' => 400000.00],
                ['name' => 'Perawatan Diri & Hobi', 'type' => 'expense', 'budget_group_id' => $funId, 'monthly_estimate' => 250000.00],

                // EXPENSES - Emergency
                ['name' => 'Pengeluaran Tak Terduga', 'type' => 'expense', 'budget_group_id' => $emergencyId, 'monthly_estimate' => 300000.00],

                // INCOMES
                ['name' => 'Gaji Pokok', 'type' => 'income', 'budget_group_id' => null, 'monthly_estimate' => 4000000.00],
                ['name' => 'Bonus & Tunjangan', 'type' => 'income', 'budget_group_id' => null, 'monthly_estimate' => 0.00],
                ['name' => 'Usaha & Freelance', 'type' => 'income', 'budget_group_id' => null, 'monthly_estimate' => 0.00],
                ['name' => 'Hasil Investasi', 'type' => 'income', 'budget_group_id' => null, 'monthly_estimate' => 0.00],
                ['name' => 'Pemasukan Lainnya', 'type' => 'income', 'budget_group_id' => null, 'monthly_estimate' => 0.00],
            ];

            foreach ($standardCategories as $cat) {
                Category::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'type' => $cat['type'],
                        'name' => $cat['name'],
                    ],
                    [
                        'budget_group_id' => $cat['budget_group_id'],
                        'monthly_estimate' => $cat['monthly_estimate'],
                        'is_active' => true,
                    ]
                );
            }

            // Ensure user has at least one active account
            $defaultAccount = Account::where('user_id', $user->id)->first();
            if (! $defaultAccount) {
                $defaultAccount = Account::create([
                    'user_id' => $user->id,
                    'name' => 'Kas Tunai / Utama',
                    'type' => 'cash',
                    'currency' => 'IDR',
                    'initial_balance' => 0.00,
                    'current_balance' => 0.00,
                    'is_active' => true,
                ]);
            }

            // 3. Migrate existing in_transactions for this user safely
            $inTransactions = DB::table('in_transactions')
                ->where('user_id', $user->id)
                ->get();

            foreach ($inTransactions as $tx) {
                $updates = [];

                // Backfill account_id if missing
                if (empty($tx->account_id)) {
                    $updates['account_id'] = $defaultAccount->id;
                }

                // Backfill category_id if missing
                if (empty($tx->category_id)) {
                    $targetCategory = null;

                    if (! empty($tx->income_source_id)) {
                        $source = DB::table('ms_income_sources')->where('id', $tx->income_source_id)->first();
                        if ($source) {
                            $sourceName = trim($source->name);
                            if (stripos($sourceName, 'gaji') !== false) {
                                $targetCategory = Category::where('user_id', $user->id)
                                    ->where('type', 'income')
                                    ->where('name', 'Gaji Pokok')
                                    ->first();
                            } elseif (stripos($sourceName, 'bonus') !== false || stripos($sourceName, 'tunjangan') !== false) {
                                $targetCategory = Category::where('user_id', $user->id)
                                    ->where('type', 'income')
                                    ->where('name', 'Bonus & Tunjangan')
                                    ->first();
                            } else {
                                $targetCategory = Category::firstOrCreate(
                                    [
                                        'user_id' => $user->id,
                                        'type' => 'income',
                                        'name' => $sourceName,
                                    ],
                                    [
                                        'monthly_estimate' => 0.00,
                                        'is_active' => true,
                                    ]
                                );
                            }
                        }
                    }

                    if (! $targetCategory) {
                        $targetCategory = Category::where('user_id', $user->id)
                            ->where('type', 'income')
                            ->first();
                    }

                    if ($targetCategory) {
                        $updates['category_id'] = $targetCategory->id;
                    }
                }

                if (! empty($updates)) {
                    DB::table('in_transactions')->where('id', $tx->id)->update($updates);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('in_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('income_source_id')->nullable(false)->change();
        });
    }
};
