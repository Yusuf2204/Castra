<?php

use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Consolidates and deduplicates all categories across all users,
     * re-pointing existing out_transactions, in_transactions, and
     * category_budget_allocations to canonical categories, and purging duplicates.
     */
    public function up(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $budgetGroups = BudgetGroup::where('user_id', $user->id)->pluck('id', 'code')->all();
            $needId = $budgetGroups['need'] ?? null;
            $funId = $budgetGroups['fun'] ?? null;
            $savingId = $budgetGroups['saving'] ?? null;
            $emergencyId = $budgetGroups['emergency'] ?? null;

            // Definition of canonical categories and their aliases to merge
            $definitions = [
                // EXPENSES - Need
                [
                    'canonical_name' => 'Makanan & Minuman',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 1240000.00,
                    'aliases' => ['makan', 'makan & konsumsi', 'makanan & minuman'],
                ],
                [
                    'canonical_name' => 'Transportasi & Bensin',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 300000.00,
                    'aliases' => ['bensin', 'bensin & transportasi', 'transportasi & kendaraan', 'pengiriman & kurir'],
                ],
                [
                    'canonical_name' => 'Tagihan & Utilitas',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 250000.00,
                    'aliases' => ['kuota', 'kuota & internet', 'bpjs', 'tagihan & utilitas'],
                ],
                [
                    'canonical_name' => 'Kebutuhan Rumah Tangga & Operasional',
                    'type' => 'expense',
                    'budget_group_id' => $needId,
                    'monthly_estimate' => 200000.00,
                    'aliases' => ['laundry', 'belanja operasional & atk', 'pemeliharaan & kebersihan', 'kebutuhan rumah tangga'],
                ],

                // EXPENSES - Fun
                [
                    'canonical_name' => 'Jajan & Kuliner',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 300000.00,
                    'aliases' => ['jajan', 'makan di luar & kopi', 'jajan & kuliner'],
                ],
                [
                    'canonical_name' => 'Belanja & Hiburan',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 400000.00,
                    'aliases' => ['belanja & hiburan', 'hiburan & santai'],
                ],
                [
                    'canonical_name' => 'Perawatan Diri & Skincare',
                    'type' => 'expense',
                    'budget_group_id' => $funId,
                    'monthly_estimate' => 250000.00,
                    'aliases' => ['skincare', 'perawatan diri & hobi'],
                ],

                // EXPENSES - Emergency & Others
                [
                    'canonical_name' => 'Pengeluaran Lainnya & Tak Terduga',
                    'type' => 'expense',
                    'budget_group_id' => $emergencyId ?: $funId,
                    'monthly_estimate' => 500000.00,
                    'aliases' => ['lainnya', 'biaya operasional lainnya', 'dana darurat', 'pengeluaran tak terduga'],
                ],

                // EXPENSES - Saving (Tabungan)
                [
                    'canonical_name' => 'Tabungan & Investasi',
                    'type' => 'expense',
                    'budget_group_id' => $savingId ?: $needId,
                    'monthly_estimate' => 790272.00,
                    'aliases' => ['tabungan rutin', 'tabungan & investasi'],
                ],

                // INCOMES
                [
                    'canonical_name' => 'Gaji Pokok',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 4000000.00,
                    'aliases' => ['gaji', 'gaji pokok'],
                ],
                [
                    'canonical_name' => 'Bonus & Tunjangan',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 0.00,
                    'aliases' => ['bonus & tunjangan', 'bonus & insentif'],
                ],
                [
                    'canonical_name' => 'Usaha & Freelance',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 0.00,
                    'aliases' => ['usaha & freelance'],
                ],
                [
                    'canonical_name' => 'Hasil Investasi',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 0.00,
                    'aliases' => ['hasil investasi'],
                ],
                [
                    'canonical_name' => 'Pemasukan Lainnya',
                    'type' => 'income',
                    'budget_group_id' => null,
                    'monthly_estimate' => 0.00,
                    'aliases' => ['pengisian kas (top up)', 'pemasukan lainnya'],
                ],
            ];

            $userCategories = Category::where('user_id', $user->id)->get();
            $handledCategoryIds = [];

            foreach ($definitions as $def) {
                // Find all existing categories matching aliases for this user
                $matchingCats = $userCategories->filter(function ($c) use ($def) {
                    $cName = strtolower(trim($c->name));
                    return in_array($cName, $def['aliases']) && $c->type === $def['type'];
                });

                if ($matchingCats->isEmpty()) {
                    // Create canonical category
                    $canonical = Category::create([
                        'user_id' => $user->id,
                        'type' => $def['type'],
                        'name' => $def['canonical_name'],
                        'budget_group_id' => $def['budget_group_id'],
                        'monthly_estimate' => $def['monthly_estimate'],
                        'is_active' => true,
                    ]);
                    $canonicalId = $canonical->id;
                } else {
                    // Pick the category with the most transactions as the canonical one, or the first one
                    $bestCat = $matchingCats->sortByDesc(function ($c) {
                        return DB::table('out_transactions')->where('category_id', $c->id)->count()
                            + DB::table('in_transactions')->where('category_id', $c->id)->count();
                    })->first();

                    $canonicalId = $bestCat->id;

                    // Update its properties to canonical standards
                    $bestCat->update([
                        'name' => $def['canonical_name'],
                        'budget_group_id' => $def['budget_group_id'],
                        'monthly_estimate' => $def['monthly_estimate'],
                        'is_active' => true,
                    ]);

                    // Merge other matching categories into canonicalId
                    foreach ($matchingCats as $otherCat) {
                        if ($otherCat->id === $canonicalId) {
                            continue;
                        }

                        // Re-point out_transactions
                        DB::table('out_transactions')
                            ->where('category_id', $otherCat->id)
                            ->update(['category_id' => $canonicalId]);

                        // Re-point in_transactions
                        DB::table('in_transactions')
                            ->where('category_id', $otherCat->id)
                            ->update(['category_id' => $canonicalId]);

                        // Re-point or consolidate budget allocations
                        $allocations = DB::table('ms_category_budget_allocations')
                            ->where('category_id', $otherCat->id)
                            ->get();

                        foreach ($allocations as $alloc) {
                            $existing = DB::table('ms_category_budget_allocations')
                                ->where('budget_period_id', $alloc->budget_period_id)
                                ->where('category_id', $canonicalId)
                                ->first();

                            if ($existing) {
                                // Keep the higher allocation
                                if ((float)$alloc->allocated_amount > (float)$existing->allocated_amount) {
                                    DB::table('ms_category_budget_allocations')
                                        ->where('id', $existing->id)
                                        ->update(['allocated_amount' => $alloc->allocated_amount]);
                                }
                                DB::table('ms_category_budget_allocations')->where('id', $alloc->id)->delete();
                            } else {
                                DB::table('ms_category_budget_allocations')
                                    ->where('id', $alloc->id)
                                    ->update(['category_id' => $canonicalId]);
                            }
                        }

                        // Safely delete duplicate category
                        $otherCat->delete();
                        $handledCategoryIds[] = $otherCat->id;
                    }
                }

                $handledCategoryIds[] = $canonicalId;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Consolidation is irreversible by design
    }
};
