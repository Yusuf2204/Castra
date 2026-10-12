<?php

namespace Tests\Feature;

use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\ExpenseTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseTransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private BudgetGroup $budgetGroup;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->budgetGroup = BudgetGroup::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Kebutuhan Pokok',
            'percentage' => 50.0,
        ]);
        $this->category = Category::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Makan & Minum',
            'type' => 'expense',
            'budget_group_id' => $this->budgetGroup->id,
            'monthly_estimate' => 2000000.0,
        ]);
    }

    public function test_authenticated_user_can_create_expense_transaction(): void
    {
        $payload = [
            'category_id' => $this->category->id,
            'transaction_date' => '2026-10-02',
            'amount' => 75000.0,
            'notes' => 'Makan siang warteg',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/expenses', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.amount', fn ($val) => (float) $val === 75000.0)
            ->assertJsonPath('data.notes', 'Makan siang warteg')
            ->assertJsonPath('data.category.id', $this->category->id);

        $this->assertDatabaseHas('out_transactions', [
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 75000.0,
            'transaction_date' => '2026-10-02',
        ]);
    }

    public function test_expense_requires_valid_expense_category_and_positive_amount(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/expenses', [
                'amount' => 0,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id', 'transaction_date', 'amount']);
    }

    public function test_user_cannot_use_income_category_for_expense(): void
    {
        $incomeCategory = Category::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'income',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/expenses', [
                'category_id' => $incomeCategory->id,
                'transaction_date' => '2026-10-02',
                'amount' => 50000,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    public function test_user_cannot_use_another_users_category(): void
    {
        $otherUser = User::factory()->create();
        $otherCategory = Category::factory()->create([
            'user_id' => $otherUser->id,
            'type' => 'expense',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/expenses', [
                'category_id' => $otherCategory->id,
                'transaction_date' => '2026-10-02',
                'amount' => 50000,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    public function test_user_only_sees_their_own_expenses(): void
    {
        $otherUser = User::factory()->create();
        $otherCategory = Category::factory()->create(['user_id' => $otherUser->id, 'type' => 'expense']);

        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 150000,
            'transaction_date' => '2026-10-02',
        ]);

        ExpenseTransaction::factory()->create([
            'user_id' => $otherUser->id,
            'category_id' => $otherCategory->id,
            'amount' => 999999,
            'transaction_date' => '2026-10-02',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/expenses');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.amount', fn ($val) => (float) $val === 150000.0);
    }

    public function test_expense_filtering_by_month_category_and_search(): void
    {
        $catTransport = Category::factory()->create([
            'user_id' => $this->user->id,
            'name' => 'Transportasi',
            'type' => 'expense',
        ]);

        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 50000,
            'transaction_date' => '2026-09-20',
            'notes' => 'Sarapan pagi',
        ]);

        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 80000,
            'transaction_date' => '2026-10-02',
            'notes' => 'Makan malam cafe',
        ]);

        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $catTransport->id,
            'amount' => 25000,
            'transaction_date' => '2026-10-03',
            'notes' => 'Bensin motor',
        ]);

        // Filter month: 2026-10
        $monthResponse = $this->actingAs($this->user)
            ->getJson('/api/expenses?month=2026-10');
        $monthResponse->assertStatus(200)->assertJsonCount(2, 'data.data');

        // Filter category: Makan & Minum in month 2026-10
        $catResponse = $this->actingAs($this->user)
            ->getJson("/api/expenses?month=2026-10&category_id={$this->category->id}");
        $catResponse->assertStatus(200)->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.notes', 'Makan malam cafe');

        // Search: 'Bensin' in month 2026-10
        $searchResponse = $this->actingAs($this->user)
            ->getJson('/api/expenses?month=2026-10&search=Bensin');
        $searchResponse->assertStatus(200)->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.notes', 'Bensin motor');
    }

    public function test_calendar_endpoint_returns_aggregated_daily_totals_for_given_month(): void
    {
        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 50000,
            'transaction_date' => '2026-10-02',
        ]);

        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 75000,
            'transaction_date' => '2026-10-02',
        ]);

        ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 120000,
            'transaction_date' => '2026-10-18',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/expenses/calendar?month=2026-10');

        $response->assertStatus(200)
            ->assertJsonPath('data.month', '2026-10')
            ->assertJsonPath('data.total_month', fn ($val) => (float) $val === 245000.0)
            ->assertJsonPath('data.transaction_count', 3)
            ->assertJsonPath('data.days.2026-10-02.total', fn ($val) => (float) $val === 125000.0)
            ->assertJsonPath('data.days.2026-10-02.count', 2)
            ->assertJsonPath('data.days.2026-10-18.total', fn ($val) => (float) $val === 120000.0)
            ->assertJsonPath('data.days.2026-10-18.count', 1);
    }

    public function test_user_can_update_their_own_expense_transaction(): void
    {
        $tx = ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 50000,
            'transaction_date' => '2026-10-02',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/expenses/{$tx->id}", [
                'amount' => 65000,
                'notes' => 'Diperbarui dengan tip',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.amount', fn ($val) => (float) $val === 65000.0)
            ->assertJsonPath('data.notes', 'Diperbarui dengan tip');

        $this->assertDatabaseHas('out_transactions', [
            'id' => $tx->id,
            'amount' => 65000.0,
            'notes' => 'Diperbarui dengan tip',
        ]);
    }

    public function test_user_can_delete_their_own_expense_transaction(): void
    {
        $tx = ExpenseTransaction::factory()->create([
            'user_id' => $this->user->id,
            'category_id' => $this->category->id,
            'amount' => 50000,
            'transaction_date' => '2026-10-02',
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/expenses/{$tx->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('out_transactions', [
            'id' => $tx->id,
        ]);
    }

    public function test_user_cannot_access_or_modify_other_users_expense(): void
    {
        $otherUser = User::factory()->create();
        $otherCategory = Category::factory()->create(['user_id' => $otherUser->id, 'type' => 'expense']);
        $tx = ExpenseTransaction::factory()->create([
            'user_id' => $otherUser->id,
            'category_id' => $otherCategory->id,
            'amount' => 100000,
        ]);

        $this->actingAs($this->user)->getJson("/api/expenses/{$tx->id}")->assertStatus(404);
        $this->actingAs($this->user)->putJson("/api/expenses/{$tx->id}", ['amount' => 999])->assertStatus(404);
        $this->actingAs($this->user)->deleteJson("/api/expenses/{$tx->id}")->assertStatus(404);
    }
}
