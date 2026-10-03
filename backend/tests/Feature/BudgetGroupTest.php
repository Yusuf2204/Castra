<?php

namespace Tests\Feature;

use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BudgetGroupTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_budget_group(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/budget-groups', [
            'code' => 'education',
            'name' => 'Pendidikan',
            'percentage' => 10.00,
            'sort_order' => 4,
            'is_active' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'education')
            ->assertJsonPath('data.name', 'Pendidikan')
            ->assertJsonPath('data.percentage', fn ($val) => (float) $val === 10.0)
            ->assertJsonPath('data.is_system', false);

        $this->assertDatabaseHas('ms_budget_groups', [
            'user_id' => $user->id,
            'code' => 'education',
        ]);
    }

    public function test_user_only_sees_their_own_budget_groups(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        BudgetGroup::factory()->for($userA)->create(['name' => 'Group A']);
        BudgetGroup::factory()->for($userB)->create(['name' => 'Group B']);

        Sanctum::actingAs($userA);

        $response = $this->getJson('/api/budget-groups');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Group A');
    }

    public function test_user_can_update_budget_group(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create([
            'code' => 'fun',
            'name' => 'Fun',
            'percentage' => 30.00,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/budget-groups/{$group->id}", [
            'code' => 'lifestyle',
            'name' => 'Gaya Hidup',
            'percentage' => 25.00,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.code', 'lifestyle')
            ->assertJsonPath('data.name', 'Gaya Hidup')
            ->assertJsonPath('data.percentage', fn ($val) => (float) $val === 25.0);
    }

    public function test_user_can_delete_custom_budget_group(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create(['is_system' => false]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/budget-groups/{$group->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ms_budget_groups', ['id' => $group->id]);
    }

    public function test_system_budget_group_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create(['is_system' => true]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/budget-groups/{$group->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Kelompok anggaran sistem tidak dapat dihapus.');

        $this->assertDatabaseHas('ms_budget_groups', ['id' => $group->id]);
    }

    public function test_budget_group_with_categories_cannot_be_deleted(): void
    {
        $user = User::factory()->create();
        $group = BudgetGroup::factory()->for($user)->create(['is_system' => false]);
        Category::factory()->for($user)->expense()->create(['budget_group_id' => $group->id]);

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/budget-groups/{$group->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Kelompok anggaran tidak dapat dihapus karena masih digunakan oleh kategori.');

        $this->assertDatabaseHas('ms_budget_groups', ['id' => $group->id]);
    }
}
