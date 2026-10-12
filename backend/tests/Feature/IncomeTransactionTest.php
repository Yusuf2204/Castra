<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\IncomeSource;
use App\Models\IncomeTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IncomeTransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private IncomeSource $incomeSource;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->incomeSource = IncomeSource::factory()->create(['user_id' => $this->user->id]);
        $this->category = Category::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'income',
        ]);
    }

    public function test_authenticated_user_can_create_income_transaction(): void
    {
        $payload = [
            'income_source_id' => $this->incomeSource->id,
            'category_id' => $this->category->id,
            'transaction_date' => '2026-10-01',
            'amount' => 5000000.0,
            'notes' => 'Gaji Pokok Oktober',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/incomes', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.amount', fn ($val) => (float) $val === 5000000.0)
            ->assertJsonPath('data.notes', 'Gaji Pokok Oktober')
            ->assertJsonPath('data.income_source.id', $this->incomeSource->id)
            ->assertJsonPath('data.category.id', $this->category->id);

        $this->assertDatabaseHas('in_transactions', [
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 5000000.0,
            'transaction_date' => '2026-10-01',
        ]);
    }

    public function test_income_transaction_requires_income_source_and_positive_amount(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/incomes', [
                'amount' => 0,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['income_source_id', 'transaction_date', 'amount']);
    }

    public function test_user_cannot_use_another_users_income_source(): void
    {
        $otherUser = User::factory()->create();
        $otherSource = IncomeSource::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/incomes', [
                'income_source_id' => $otherSource->id,
                'transaction_date' => '2026-10-01',
                'amount' => 1000000,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['income_source_id']);
    }

    public function test_user_cannot_use_expense_category_for_income(): void
    {
        $expenseCategory = Category::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'expense',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/incomes', [
                'income_source_id' => $this->incomeSource->id,
                'category_id' => $expenseCategory->id,
                'transaction_date' => '2026-10-01',
                'amount' => 1000000,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    public function test_user_only_sees_their_own_incomes(): void
    {
        $otherUser = User::factory()->create();
        $otherSource = IncomeSource::factory()->create(['user_id' => $otherUser->id]);

        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 2000000,
            'transaction_date' => '2026-10-01',
        ]);

        IncomeTransaction::factory()->create([
            'user_id' => $otherUser->id,
            'income_source_id' => $otherSource->id,
            'amount' => 9999999,
            'transaction_date' => '2026-10-01',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/incomes');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.amount', fn ($val) => (float) $val === 2000000.0);
    }

    public function test_income_filtering_by_month_and_search(): void
    {
        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 1000000,
            'transaction_date' => '2026-09-15',
            'notes' => 'Proyek Freelance A',
        ]);

        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 2000000,
            'transaction_date' => '2026-10-05',
            'notes' => 'Proyek Freelance B',
        ]);

        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 3000000,
            'transaction_date' => '2026-10-10',
            'notes' => 'Bonus Kuartal',
        ]);

        // Filter month: 2026-10
        $monthResponse = $this->actingAs($this->user)
            ->getJson('/api/incomes?month=2026-10');
        $monthResponse->assertStatus(200)->assertJsonCount(2, 'data.data');

        // Search: 'Freelance' in month 2026-10
        $searchResponse = $this->actingAs($this->user)
            ->getJson('/api/incomes?month=2026-10&search=Freelance');
        $searchResponse->assertStatus(200)->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.notes', 'Proyek Freelance B');
    }

    public function test_calendar_endpoint_returns_daily_breakdown_and_total(): void
    {
        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 1000000,
            'transaction_date' => '2026-10-01',
        ]);

        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 2000000,
            'transaction_date' => '2026-10-01',
        ]);

        IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 500000,
            'transaction_date' => '2026-10-15',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/incomes/calendar?month=2026-10');

        $response->assertStatus(200)
            ->assertJsonPath('data.month', '2026-10')
            ->assertJsonPath('data.total_month', fn ($val) => (float) $val === 3500000.0)
            ->assertJsonPath('data.transaction_count', 3)
            ->assertJsonPath('data.days.2026-10-01.total', fn ($val) => (float) $val === 3000000.0)
            ->assertJsonPath('data.days.2026-10-01.count', 2)
            ->assertJsonPath('data.days.2026-10-15.total', fn ($val) => (float) $val === 500000.0)
            ->assertJsonPath('data.days.2026-10-15.count', 1);
    }

    public function test_user_can_update_their_own_income_transaction(): void
    {
        $tx = IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 1000000,
            'transaction_date' => '2026-10-01',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/incomes/{$tx->id}", [
                'amount' => 1500000,
                'notes' => 'Diperbarui',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.amount', fn ($val) => (float) $val === 1500000.0)
            ->assertJsonPath('data.notes', 'Diperbarui');

        $this->assertDatabaseHas('in_transactions', [
            'id' => $tx->id,
            'amount' => 1500000,
            'notes' => 'Diperbarui',
        ]);
    }

    public function test_user_can_delete_their_own_income_transaction(): void
    {
        $tx = IncomeTransaction::factory()->create([
            'user_id' => $this->user->id,
            'income_source_id' => $this->incomeSource->id,
            'amount' => 1000000,
            'transaction_date' => '2026-10-01',
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/incomes/{$tx->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('in_transactions', [
            'id' => $tx->id,
        ]);
    }

    public function test_user_cannot_access_or_modify_other_users_income(): void
    {
        $otherUser = User::factory()->create();
        $otherSource = IncomeSource::factory()->create(['user_id' => $otherUser->id]);
        $tx = IncomeTransaction::factory()->create([
            'user_id' => $otherUser->id,
            'income_source_id' => $otherSource->id,
            'amount' => 5000000,
        ]);

        $this->actingAs($this->user)->getJson("/api/incomes/{$tx->id}")->assertStatus(404);
        $this->actingAs($this->user)->putJson("/api/incomes/{$tx->id}", ['amount' => 999])->assertStatus(404);
        $this->actingAs($this->user)->deleteJson("/api/incomes/{$tx->id}")->assertStatus(404);
    }
}
