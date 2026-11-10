<?php

use App\Models\Account;
use App\Models\BudgetPeriod;
use App\Models\ExpenseTransaction;
use App\Models\IncomeTransaction;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Synchronizes and repairs legacy transaction data:
     * 1. Reassigns October salary income to main bank account instead of petty cash.
     * 2. Backfills unassigned (NULL account_id) expense transactions to user's main bank account.
     * 3. Fills missing payee/vendor from notes for cleaner vouchers and bookkeeping.
     * 4. Links active budget period (Nov cycle) to corresponding salary income transaction.
     * 5. Recalculates all account balances to reflect exact financial positions.
     */
    public function up(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $mainAccount = Account::where('user_id', $user->id)
                ->where('type', 'bank')
                ->first()
                ?? Account::where('user_id', $user->id)->first();

            if (! $mainAccount) {
                continue;
            }

            // 1. Move salary income transactions to main bank account if they were wrongly mapped to petty cash
            $salaryIncomes = IncomeTransaction::where('user_id', $user->id)
                ->where(function ($q) {
                    $q->where('notes', 'like', '%gaji%')
                      ->orWhereHas('category', function ($cq) {
                          $cq->where('name', 'like', '%gaji%');
                      });
                })
                ->get();

            foreach ($salaryIncomes as $inc) {
                if ($inc->account_id !== $mainAccount->id) {
                    $inc->update(['account_id' => $mainAccount->id]);
                }
            }

            // 2. Backfill unassigned expense transactions (account_id = null) to user's main account
            $unassignedExpenses = ExpenseTransaction::where('user_id', $user->id)
                ->whereNull('account_id')
                ->get();

            foreach ($unassignedExpenses as $exp) {
                $exp->update(['account_id' => $mainAccount->id]);
            }

            // 3. Populate missing payee from notes if empty
            $emptyPayeeExpenses = ExpenseTransaction::where('user_id', $user->id)
                ->where(function ($q) {
                    $q->whereNull('payee')->orWhere('payee', '');
                })
                ->get();

            foreach ($emptyPayeeExpenses as $exp) {
                $payee = ! empty($exp->notes) ? trim($exp->notes) : ($exp->category?->name ?? 'Pengeluaran');
                $exp->update(['payee' => $payee]);
            }

            // 4. Link budget periods with matching salary income transactions if not linked
            $budgetPeriods = BudgetPeriod::where('user_id', $user->id)
                ->whereNull('income_transaction_id')
                ->get();

            foreach ($budgetPeriods as $period) {
                $matchingIncome = IncomeTransaction::where('user_id', $user->id)
                    ->where('amount', $period->total_income_allocated)
                    ->whereBetween('transaction_date', [
                        $period->start_date->copy()->subDays(5)->format('Y-m-d'),
                        $period->start_date->copy()->addDays(5)->format('Y-m-d'),
                    ])
                    ->first();

                if ($matchingIncome) {
                    $period->update(['income_transaction_id' => $matchingIncome->id]);
                }
            }
        }

        // 5. Recalculate balance for all accounts in the database
        $allAccounts = Account::all();
        foreach ($allAccounts as $account) {
            $account->recalculateBalance();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Data repair is irreversible by design
    }
};
