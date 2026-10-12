<?php

namespace Tests\Feature;

use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\ExpenseTransaction;
use App\Models\IncomeSource;
use App\Models\IncomeTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private BudgetGroup $budgetNeed;

    private BudgetGroup $budgetFun;

    private Category $catMakan;

    private Category $catLiburan;

    private IncomeSource $incomeSource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        $this->budgetNeed = BudgetGroup::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Need',
            'percentage' => 50.0,
        ]);

        $this->budgetFun = BudgetGroup::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Fun',
            'percentage' => 30.0,
        ]);

        $this->catMakan = Category::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Makan',
            'type' => 'expense',
            'budget_group_id' => $this->budgetNeed->id,
            'monthly_estimate' => 1000000.0,
        ]);

        $this->catLiburan = Category::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Liburan',
            'type' => 'expense',
            'budget_group_id' => $this->budgetFun->id,
            'monthly_estimate' => 500000.0,
        ]);

        $this->incomeSource = IncomeSource::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Gaji Pokok',
        ]);
    }

    public function test_cash_flow_report_returns_monthly_totals_and_cumulative_balance(): void
    {
        // Jan: Income 10jt, Expense 4jt -> Net 6jt, Cumulative 6jt
        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 10000000.0,
            'transaction_date' => '2026-01-05',
        ]);
        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->catMakan->id,
            'amount' => 4000000.0,
            'transaction_date' => '2026-01-10',
        ]);

        // Feb: Income 5jt, Expense 7jt -> Net -2jt, Cumulative 4jt
        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 5000000.0,
            'transaction_date' => '2026-02-05',
        ]);
        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->catMakan->id,
            'amount' => 7000000.0,
            'transaction_date' => '2026-02-15',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/cash-flow?year=2026');

        $response->assertStatus(200)
            ->assertJsonPath('data.year', 2026)
            ->assertJsonPath('data.total_income_year', fn ($val) => (float) $val === 15000000.0)
            ->assertJsonPath('data.total_expense_year', fn ($val) => (float) $val === 11000000.0)
            ->assertJsonPath('data.net_balance_year', fn ($val) => (float) $val === 4000000.0)
            ->assertJsonPath('data.months.0.month', 1)
            ->assertJsonPath('data.months.0.net_balance', fn ($val) => (float) $val === 6000000.0)
            ->assertJsonPath('data.months.0.cumulative_balance', fn ($val) => (float) $val === 6000000.0)
            ->assertJsonPath('data.months.1.month', 2)
            ->assertJsonPath('data.months.1.net_balance', fn ($val) => (float) $val === -2000000.0)
            ->assertJsonPath('data.months.1.cumulative_balance', fn ($val) => (float) $val === 4000000.0);

        // Verify record in rpt_monthly_summaries table
        $this->assertDatabaseHas('rpt_monthly_summaries', [
            'user_id' => $this->user->id,
            'year' => 2026,
            'month' => 1,
            'net_balance' => 6000000.0,
        ]);
    }

    public function test_budget_comparison_evaluates_safe_near_limit_and_over_budget_status(): void
    {
        // CatMakan estimate 1.000.000
        // Expense 500.000 (50%) -> safe
        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->catMakan->id,
            'amount' => 500000.0,
            'transaction_date' => '2026-10-05',
        ]);

        // CatLiburan estimate 500.000
        // Expense 600.000 (120%) -> over_budget
        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->catLiburan->id,
            'amount' => 600000.0,
            'transaction_date' => '2026-10-10',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/budget-comparison?month=2026-10');

        $response->assertStatus(200)
            ->assertJsonPath('data.month', '2026-10')
            ->assertJsonPath('data.total_estimated', fn ($val) => (float) $val === 1500000.0)
            ->assertJsonPath('data.total_actual', fn ($val) => (float) $val === 1100000.0);

        $items = collect($response->json('data.items'));
        $makanItem = $items->firstWhere('category_id', $this->catMakan->id);
        $liburanItem = $items->firstWhere('category_id', $this->catLiburan->id);

        $this->assertEquals('safe', $makanItem['status']);
        $this->assertEquals(50.0, $makanItem['usage_percentage']);

        $this->assertEquals('over_budget', $liburanItem['status']);
        $this->assertEquals(120.0, $liburanItem['usage_percentage']);
    }

    public function test_category_breakdown_aggregates_by_budget_group(): void
    {
        // Need: 400.000
        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->catMakan->id,
            'amount' => 400000.0,
            'transaction_date' => '2026-10-05',
        ]);

        // Fun: 600.000
        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->catLiburan->id,
            'amount' => 600000.0,
            'transaction_date' => '2026-10-10',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/category-breakdown?month=2026-10');

        $response->assertStatus(200)
            ->assertJsonPath('data.total_expense', fn ($val) => (float) $val === 1000000.0);

        $bgGroups = collect($response->json('data.budget_groups'));
        $funBg = $bgGroups->firstWhere('name', 'Fun');
        $needBg = $bgGroups->firstWhere('name', 'Need');

        $this->assertEquals(600000.0, $funBg['total']);
        $this->assertEquals(60.0, $funBg['percentage']);

        $this->assertEquals(400000.0, $needBg['total']);
        $this->assertEquals(40.0, $needBg['percentage']);
    }

    public function test_dashboard_summary_returns_financial_kpi_for_authenticated_user(): void
    {
        $today = now()->format('Y-m-d');

        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 7000000.0,
            'transaction_date' => $today,
        ]);

        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->catMakan->id,
            'amount' => 2000000.0,
            'transaction_date' => $today,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard-summary');

        $response->assertStatus(200)
            ->assertJsonPath('data.finance.kpis.month_income', fn ($val) => (float) $val === 7000000.0)
            ->assertJsonPath('data.finance.kpis.month_expense', fn ($val) => (float) $val === 2000000.0)
            ->assertJsonPath('data.finance.kpis.month_net', fn ($val) => (float) $val === 5000000.0)
            ->assertJsonCount(1, 'data.finance.recent_incomes')
            ->assertJsonCount(1, 'data.finance.recent_expenses');
    }

    public function test_reports_are_isolated_per_user(): void
    {
        $otherUser = User::factory()->create();
        $otherSource = IncomeSource::factory()->create(['user_id' => $otherUser->id]);

        IncomeTransaction::factory()->create([
            'user_id' => $otherUser->id,
            'income_source_id' => $otherSource->id,
            'amount' => 99000000.0,
            'transaction_date' => '2026-10-01',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/reports/cash-flow?year=2026');

        $response->assertStatus(200)
            ->assertJsonPath('data.total_income_year', fn ($val) => (float) $val === 0.0);
    }
}
