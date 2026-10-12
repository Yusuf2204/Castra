<?php

namespace App\Services;

use App\Models\MonthlySummary;
use App\Models\User;
use Carbon\Carbon;

class ReportService
{
    private const MONTH_NAMES_ID = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    public function getCashFlow(User $user, int $year): array
    {
        $months = [];
        $totalIncomeYear = 0.0;
        $totalExpenseYear = 0.0;
        $cumulativeBalance = 0.0;

        for ($m = 1; $m <= 12; $m++) {
            $income = (float) $user->incomeTransactions()
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $m)
                ->sum('amount');

            $expense = (float) $user->expenseTransactions()
                ->whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $m)
                ->sum('amount');

            $net = $income - $expense;
            $cumulativeBalance += $net;

            $totalIncomeYear += $income;
            $totalExpenseYear += $expense;

            // Update or create summary in rpt_monthly_summaries
            MonthlySummary::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'year' => $year,
                    'month' => $m,
                ],
                [
                    'total_income' => $income,
                    'total_expense' => $expense,
                    'net_balance' => $net,
                ]
            );

            $months[] = [
                'month' => $m,
                'month_name' => self::MONTH_NAMES_ID[$m],
                'month_key' => sprintf('%04d-%02d', $year, $m),
                'total_income' => $income,
                'total_expense' => $expense,
                'net_balance' => $net,
                'cumulative_balance' => $cumulativeBalance,
            ];
        }

        return [
            'year' => $year,
            'total_income_year' => $totalIncomeYear,
            'total_expense_year' => $totalExpenseYear,
            'net_balance_year' => $totalIncomeYear - $totalExpenseYear,
            'months' => $months,
        ];
    }

    public function getBudgetComparison(User $user, ?string $monthStr = null, ?int $periodId = null): array
    {
        $budgetPeriod = null;
        if ($periodId) {
            $budgetPeriod = $user->budgetPeriods()
                ->with(['allocations'])
                ->find($periodId);
        }

        // If no periodId provided, check if user requested month or has active period
        if (! $budgetPeriod && ! $monthStr) {
            $budgetPeriod = $user->budgetPeriods()
                ->where('is_active', true)
                ->with(['allocations'])
                ->first();
        }

        $categories = $user->categories()
            ->where('type', 'expense')
            ->with('budgetGroup')
            ->orderBy('name')
            ->get();

        $items = [];
        $totalEstimated = 0.0;
        $totalActual = 0.0;

        if ($budgetPeriod) {
            $allocationsMap = $budgetPeriod->allocations->keyBy('category_id');
            $startDate = Carbon::parse($budgetPeriod->start_date)->startOfDay();
            $endDate = Carbon::parse($budgetPeriod->end_date)->endOfDay();

            foreach ($categories as $cat) {
                $estimate = isset($allocationsMap[$cat->id])
                    ? (float) $allocationsMap[$cat->id]->allocated_amount
                    : (float) $cat->monthly_estimate;

                $actual = (float) $user->expenseTransactions()
                    ->where('category_id', $cat->id)
                    ->whereBetween('transaction_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->sum('amount');

                $variance = $estimate - $actual;

                $usagePercentage = $estimate > 0
                    ? round(($actual / $estimate) * 100, 1)
                    : ($actual > 0 ? 100.0 : 0.0);

                $status = 'safe';
                if ($estimate > 0 && $actual > $estimate) {
                    $status = 'over_budget';
                } elseif ($estimate > 0 && ($actual / $estimate) >= 0.8) {
                    $status = 'near_limit';
                } elseif ($estimate == 0 && $actual > 0) {
                    $status = 'over_budget';
                }

                $totalEstimated += $estimate;
                $totalActual += $actual;

                $items[] = [
                    'category_id' => $cat->id,
                    'category_name' => $cat->name,
                    'budget_group' => $cat->budgetGroup ? [
                        'id' => $cat->budgetGroup->id,
                        'name' => $cat->budgetGroup->name,
                        'percentage' => (float) $cat->budgetGroup->percentage,
                    ] : null,
                    'baseline_estimate' => (float) $cat->monthly_estimate,
                    'monthly_estimate' => $estimate,
                    'actual_expense' => $actual,
                    'variance' => $variance,
                    'usage_percentage' => $usagePercentage,
                    'status' => $status,
                ];
            }

            $overallUsage = $totalEstimated > 0
                ? round(($totalActual / $totalEstimated) * 100, 1)
                : ($totalActual > 0 ? 100.0 : 0.0);

            return [
                'period_mode' => 'budget_period',
                'period' => [
                    'id' => $budgetPeriod->id,
                    'name' => $budgetPeriod->name,
                    'start_date' => $budgetPeriod->start_date->format('Y-m-d'),
                    'end_date' => $budgetPeriod->end_date->format('Y-m-d'),
                    'total_income_allocated' => (float) $budgetPeriod->total_income_allocated,
                    'is_active' => (bool) $budgetPeriod->is_active,
                ],
                'month' => $monthStr ?? Carbon::now()->format('Y-m'),
                'total_estimated' => $totalEstimated,
                'total_actual' => $totalActual,
                'total_variance' => $totalEstimated - $totalActual,
                'overall_usage_percentage' => $overallUsage,
                'items' => $items,
            ];
        }

        // Standard calendar month fallback
        $effectiveMonthStr = $monthStr ?? Carbon::now()->format('Y-m');
        $date = Carbon::createFromFormat('Y-m', $effectiveMonthStr);

        foreach ($categories as $cat) {
            $estimate = (float) $cat->monthly_estimate;
            $actual = (float) $user->expenseTransactions()
                ->where('category_id', $cat->id)
                ->whereYear('transaction_date', $date->year)
                ->whereMonth('transaction_date', $date->month)
                ->sum('amount');

            $variance = $estimate - $actual;

            $usagePercentage = $estimate > 0
                ? round(($actual / $estimate) * 100, 1)
                : ($actual > 0 ? 100.0 : 0.0);

            $status = 'safe';
            if ($estimate > 0 && $actual > $estimate) {
                $status = 'over_budget';
            } elseif ($estimate > 0 && ($actual / $estimate) >= 0.8) {
                $status = 'near_limit';
            } elseif ($estimate == 0 && $actual > 0) {
                $status = 'over_budget';
            }

            $totalEstimated += $estimate;
            $totalActual += $actual;

            $items[] = [
                'category_id' => $cat->id,
                'category_name' => $cat->name,
                'budget_group' => $cat->budgetGroup ? [
                    'id' => $cat->budgetGroup->id,
                    'name' => $cat->budgetGroup->name,
                    'percentage' => (float) $cat->budgetGroup->percentage,
                ] : null,
                'baseline_estimate' => (float) $cat->monthly_estimate,
                'monthly_estimate' => $estimate,
                'actual_expense' => $actual,
                'variance' => $variance,
                'usage_percentage' => $usagePercentage,
                'status' => $status,
            ];
        }

        $overallUsage = $totalEstimated > 0
            ? round(($totalActual / $totalEstimated) * 100, 1)
            : ($totalActual > 0 ? 100.0 : 0.0);

        return [
            'period_mode' => 'calendar_month',
            'period' => null,
            'month' => $effectiveMonthStr,
            'total_estimated' => $totalEstimated,
            'total_actual' => $totalActual,
            'total_variance' => $totalEstimated - $totalActual,
            'overall_usage_percentage' => $overallUsage,
            'items' => $items,
        ];
    }

    public function getCategoryBreakdown(User $user, string $monthStr): array
    {
        $date = Carbon::createFromFormat('Y-m', $monthStr);

        $totalMonthExpense = (float) $user->expenseTransactions()
            ->whereYear('transaction_date', $date->year)
            ->whereMonth('transaction_date', $date->month)
            ->sum('amount');

        $categories = $user->categories()
            ->where('type', 'expense')
            ->with('budgetGroup')
            ->get();

        $budgetGroupTotals = [];
        $categoryBreakdown = [];

        foreach ($categories as $cat) {
            $actual = (float) $user->expenseTransactions()
                ->where('category_id', $cat->id)
                ->whereYear('transaction_date', $date->year)
                ->whereMonth('transaction_date', $date->month)
                ->sum('amount');

            if ($actual > 0) {
                $percentage = $totalMonthExpense > 0
                    ? round(($actual / $totalMonthExpense) * 100, 1)
                    : 0.0;

                $bgName = $cat->budgetGroup ? $cat->budgetGroup->name : 'Lainnya';
                $bgId = $cat->budgetGroup ? $cat->budgetGroup->id : 0;

                if (! isset($budgetGroupTotals[$bgId])) {
                    $budgetGroupTotals[$bgId] = [
                        'id' => $bgId,
                        'name' => $bgName,
                        'total' => 0.0,
                        'percentage' => 0.0,
                    ];
                }
                $budgetGroupTotals[$bgId]['total'] += $actual;

                $categoryBreakdown[] = [
                    'category_id' => $cat->id,
                    'category_name' => $cat->name,
                    'budget_group_name' => $bgName,
                    'total_expense' => $actual,
                    'percentage' => $percentage,
                ];
            }
        }

        // Calculate budget group percentages
        foreach ($budgetGroupTotals as $bgId => $data) {
            $budgetGroupTotals[$bgId]['percentage'] = $totalMonthExpense > 0
                ? round(($data['total'] / $totalMonthExpense) * 100, 1)
                : 0.0;
        }

        // Sort descending
        usort($categoryBreakdown, fn ($a, $b) => $b['total_expense'] <=> $a['total_expense']);
        usort($budgetGroupTotals, fn ($a, $b) => $b['total'] <=> $a['total']);

        return [
            'month' => $monthStr,
            'total_expense' => $totalMonthExpense,
            'budget_groups' => array_values($budgetGroupTotals),
            'categories' => $categoryBreakdown,
        ];
    }

    public function getDashboardSummary(User $user): array
    {
        $now = Carbon::now();
        $currentMonthStr = $now->format('Y-m');

        // Month KPIs
        $monthIncome = (float) $user->incomeTransactions()
            ->whereYear('transaction_date', $now->year)
            ->whereMonth('transaction_date', $now->month)
            ->sum('amount');

        $monthExpense = (float) $user->expenseTransactions()
            ->whereYear('transaction_date', $now->year)
            ->whereMonth('transaction_date', $now->month)
            ->sum('amount');

        $monthNet = $monthIncome - $monthExpense;

        // All-Time KPIs
        $allTimeIncome = (float) $user->incomeTransactions()->sum('amount');
        $allTimeExpense = (float) $user->expenseTransactions()->sum('amount');
        $allTimeNet = $allTimeIncome - $allTimeExpense;

        // Budget comparison (uses active period if exists, otherwise current month)
        $activePeriod = $user->budgetPeriods()->where('is_active', true)->first();
        $budgetComparison = $activePeriod
            ? $this->getBudgetComparison($user, null, $activePeriod->id)
            : $this->getBudgetComparison($user, $currentMonthStr);

        // Recent 5 transactions
        $recentIncomes = $user->incomeTransactions()
            ->with(['incomeSource', 'category'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->take(5)
            ->get()
            ->map(fn ($tx) => [
                'id' => $tx->id,
                'date' => $tx->transaction_date?->format('Y-m-d') ?? $tx->transaction_date,
                'source' => $tx->incomeSource?->name ?? '-',
                'category' => $tx->category?->name ?? '-',
                'amount' => (float) $tx->amount,
                'notes' => $tx->notes,
            ]);

        $recentExpenses = $user->expenseTransactions()
            ->with(['category.budgetGroup'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->take(5)
            ->get()
            ->map(fn ($tx) => [
                'id' => $tx->id,
                'date' => $tx->transaction_date?->format('Y-m-d') ?? $tx->transaction_date,
                'category' => $tx->category?->name ?? '-',
                'budget_group' => $tx->category?->budgetGroup?->name ?? '-',
                'amount' => (float) $tx->amount,
                'notes' => $tx->notes,
            ]);

        return [
            'month' => $currentMonthStr,
            'kpis' => [
                'month_income' => $monthIncome,
                'month_expense' => $monthExpense,
                'month_net' => $monthNet,
                'all_time_income' => $allTimeIncome,
                'all_time_expense' => $allTimeExpense,
                'all_time_net' => $allTimeNet,
                'total_budget_estimate' => $budgetComparison['total_estimated'],
                'budget_usage_percentage' => $budgetComparison['overall_usage_percentage'],
                'period_mode' => $budgetComparison['period_mode'],
                'active_period' => $budgetComparison['period'] ?? null,
            ],
            'recent_incomes' => $recentIncomes,
            'recent_expenses' => $recentExpenses,
        ];
    }
}
