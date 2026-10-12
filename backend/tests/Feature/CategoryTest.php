<?php

namespace Tests\Feature;

use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_expense_category_with_budget_group(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create(['name' => 'Need']);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/categories', [
            'name' => 'Makan',
            'type' => 'expense',
            'budget_group_id' => $group->id,
            'monthly_estimate' => 1250000,
            'is_active' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Makan')
            ->assertJsonPath('data.type', 'expense')
            ->assertJsonPath('data.budget_group_id', $group->id)
            ->assertJsonPath('data.monthly_estimate', 1250000)
            ->assertJsonPath('message', 'Category created');

        $this->assertDatabaseHas('ms_categories', [
            'user_id' => $user->id,
            'name' => 'Makan',
            'type' => 'expense',
            'budget_group_id' => $group->id,
        ]);
    }

    public function test_authenticated_user_can_create_income_category_without_budget_group(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/categories', [
            'name' => 'Gaji Pokok',
            'type' => 'income',
            'budget_group_id' => null,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Gaji Pokok')
            ->assertJsonPath('data.type', 'income')
            ->assertJsonPath('data.budget_group_id', null);

        $this->assertDatabaseHas('ms_categories', [
            'user_id' => $user->id,
            'name' => 'Gaji Pokok',
            'type' => 'income',
        ]);
    }

    public function test_expense_category_requires_budget_group(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/categories', [
            'name' => 'Belanja',
            'type' => 'expense',
            'budget_group_id' => null,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('budget_group_id');
    }

    public function test_name_and_type_are_required(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/categories', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'type']);
    }

    public function test_category_name_must_be_unique_per_user_and_type(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create();

        Category::factory()->for($user)->create([
            'name' => 'Makan',
            'type' => 'expense',
            'budget_group_id' => $group->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/categories', [
            'name' => 'Makan',
            'type' => 'expense',
            'budget_group_id' => $group->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_same_name_allowed_for_different_types(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create();

        Category::factory()->for($user)->create([
            'name' => 'Investasi',
            'type' => 'income',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/categories', [
            'name' => 'Investasi',
            'type' => 'expense',
            'budget_group_id' => $group->id,
        ]);

        $response->assertStatus(201);
    }

    public function test_user_only_sees_their_own_categories(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Category::factory()->for($userA)->income()->create(['name' => 'Gaji A']);
        Category::factory()->for($userB)->income()->create(['name' => 'Gaji B']);

        Sanctum::actingAs($userA);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'Gaji A');
    }

    public function test_filter_by_type_works(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create();

        Category::factory()->for($user)->income()->create(['name' => 'Gaji']);
        Category::factory()->for($user)->expense()->create(['name' => 'Makan', 'budget_group_id' => $group->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/categories?type=expense');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'Makan');
    }

    public function test_filter_by_is_active_works(): void
    {
        $user = User::factory()->create();

        Category::factory()->for($user)->income()->create(['name' => 'Aktif', 'is_active' => true]);
        Category::factory()->for($user)->income()->create(['name' => 'Nonaktif', 'is_active' => false]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/categories?is_active=0');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'Nonaktif');
    }

    public function test_all_flag_returns_unpaginated_array(): void
    {
        $user = User::factory()->create();
        Category::factory()->for($user)->income()->count(3)->create();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/categories?all=1');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_user_can_update_their_own_category(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create();
        $category = Category::factory()->for($user)->expense()->create([
            'name' => 'Makan Siang',
            'budget_group_id' => $group->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/categories/{$category->id}", [
            'name' => 'Makan & Minum',
            'budget_group_id' => $group->id,
            'monthly_estimate' => 1500000,
            'is_active' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Makan & Minum')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.monthly_estimate', 1500000);
    }

    public function test_user_can_delete_their_own_category(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->income()->create();

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ms_categories', ['id' => $category->id]);
    }

    public function test_user_cannot_delete_category_with_transactions(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->for($user)->expense()->create();

        // Insert dummy transaction using query builder
        DB::table('transactions')->insert([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'date' => '2026-10-01',
            'description' => 'Test expense',
            'amount' => -50000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Kategori tidak dapat dihapus karena sudah dipakai dalam transaksi.');

        $this->assertDatabaseHas('ms_categories', ['id' => $category->id]);
    }
}
