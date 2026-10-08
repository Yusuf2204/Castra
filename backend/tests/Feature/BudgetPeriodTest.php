<?php

namespace Tests\Feature;

use App\Models\BudgetGroup;
use App\Models\BudgetPeriod;
use App\Models\Category;
use App\Models\ExpenseTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetPeriodTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected BudgetGroup $budgetGroup;

    protected Category $categoryFood;

    protected Category $categoryTransport;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->budgetGroup = BudgetGroup::create([
            'user_id' => $this->user->id,
            'code' => 'need',
            'name' => 'Kebutuhan Pokok',
            'percentage' => 50.0,
            'sort_order' => 1,
            'is_system' => true,
            'is_active' => true,
        ]);

        $this->categoryFood = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Makan & Minum',
            'type' => 'expense',
            'budget_group_id' => $this->budgetGroup->id,
            'monthly_estimate' => 2000000.0,
            'is_active' => true,
        ]);

        $this->categoryTransport = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Bensin & Transportasi',
            'type' => 'expense',
            'budget_group_id' => $this->budgetGroup->id,
            'monthly_estimate' => 500000.0,
            'is_active' => true,
        ]);
    }

    public function test_user_can_create_budget_period_with_auto_generated_allocations(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/budget-periods', [
                'name' => 'Siklus 5 Okt - 4 Nov 2026',
                'start_date' => '2026-10-05',
                'end_date' => '2026-11-04',
                'total_income_allocated' => 8000000.0,
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Siklus 5 Okt - 4 Nov 2026')
            ->assertJsonPath('data.start_date', '2026-10-05')
            ->assertJsonPath('data.end_date', '2026-11-04')
            ->assertJsonPath('data.is_active', true);

        $this->assertEquals(8000000.0, $response->json('data.total_income_allocated'));

        // Check allocations auto-generated from baseline
        $periodId = $response->json('data.id');
        $this->assertDatabaseHas('ms_budget_periods', [
            'id' => $periodId,
            'user_id' => $this->user->id,
        ]);

        $this->assertDatabaseHas('ms_category_budget_allocations', [
            'budget_period_id' => $periodId,
            'category_id' => $this->categoryFood->id,
            'allocated_amount' => 2000000.0,
        ]);

        $this->assertDatabaseHas('ms_category_budget_allocations', [
            'budget_period_id' => $periodId,
            'category_id' => $this->categoryTransport->id,
            'allocated_amount' => 500000.0,
        ]);
    }

    public function test_user_can_update_category_allocations(): void
    {
        $period = BudgetPeriod::create([
            'user_id' => $this->user->id,
            'name' => 'Oktober 2026',
            'start_date' => '2026-10-05',
            'end_date' => '2026-11-04',
            'total_income_allocated' => 10000000.0,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/budget-periods/{$period->id}/allocations", [
                'allocations' => [
                    [
                        'category_id' => $this->categoryFood->id,
                        'allocated_amount' => 2500000.0,
                        'notes' => 'Tambahan belanja lauk',
                    ],
                    [
                        'category_id' => $this->categoryTransport->id,
                        'allocated_amount' => 700000.0,
                    ],
                ],
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('ms_category_budget_allocations', [
            'budget_period_id' => $period->id,
            'category_id' => $this->categoryFood->id,
            'allocated_amount' => 2500000.0,
            'notes' => 'Tambahan belanja lauk',
        ]);
    }

    public function test_user_can_extend_period_end_date_when_payday_delayed(): void
    {
        $period = BudgetPeriod::create([
            'user_id' => $this->user->id,
            'name' => 'Oktober 2026',
            'start_date' => '2026-10-05',
            'end_date' => '2026-11-04',
            'is_active' => true,
        ]);

        // Payday delayed from 5 Nov to 7 Nov -> end_date changed to 2026-11-06
        $response = $this->actingAs($this->user)
            ->putJson("/api/budget-periods/{$period->id}", [
                'end_date' => '2026-11-06',
                'notes' => 'Gajian mundur ke 7 November',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.end_date', '2026-11-06')
            ->assertJsonPath('data.notes', 'Gajian mundur ke 7 November');

        $this->assertDatabaseHas('ms_budget_periods', [
            'id' => $period->id,
            'end_date' => '2026-11-06',
        ]);
    }

    public function test_budget_comparison_report_uses_period_allocations_and_date_range(): void
    {
        $period = BudgetPeriod::create([
            'user_id' => $this->user->id,
            'name' => 'Siklus Okt 2026',
            'start_date' => '2026-10-05',
            'end_date' => '2026-11-04',
            'total_income_allocated' => 5000000.0,
            'is_active' => true,
        ]);

        $period->allocations()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->categoryFood->id,
            'allocated_amount' => 1000000.0, // Alokasi dinamis 1 jt, baseline nya 2 jt
        ]);

        // Transaksi di dalam rentang siklus (misal 10 Okt)
        ExpenseTransaction::create([
            'user_id' => $this->user->id,
            'category_id' => $this->categoryFood->id,
            'amount' => 900000.0, // 90% dari 1 jt -> status near_limit
            'transaction_date' => '2026-10-10',
            'notes' => 'Makan dalam siklus',
        ]);

        // Transaksi di luar rentang siklus (misal 2 Okt, masuk siklus sebelumnya)
        ExpenseTransaction::create([
            'user_id' => $this->user->id,
            'category_id' => $this->categoryFood->id,
            'amount' => 400000.0,
            'transaction_date' => '2026-10-02',
            'notes' => 'Makan sebelum siklus',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/reports/budget-comparison?period_id={$period->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.period_mode', 'budget_period')
            ->assertJsonPath('data.period.id', $period->id);

        $items = collect($response->json('data.items'));
        $foodItem = $items->firstWhere('category_id', $this->categoryFood->id);

        $this->assertEquals(1000000.0, $foodItem['monthly_estimate']);
        $this->assertEquals(900000.0, $foodItem['actual_expense']); // Hanya yang di dalam rentang tanggal 5 Okt - 4 Nov
        $this->assertEquals('near_limit', $foodItem['status']);
    }
}
