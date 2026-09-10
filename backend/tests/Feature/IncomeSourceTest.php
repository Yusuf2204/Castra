<?php

namespace Tests\Feature;

use App\Models\IncomeSource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IncomeSourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_income_source(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/income-sources', [
            'name' => 'Gaji',
            'description' => 'Gaji bulanan',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Gaji')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('message', 'Income source created');

        $this->assertDatabaseHas('income_sources', [
            'user_id' => $user->id,
            'name' => 'Gaji',
        ]);
    }

    public function test_name_is_required(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/income-sources', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_name_must_be_unique_per_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        IncomeSource::factory()->for($user)->create(['name' => 'Gaji']);

        $response = $this->postJson('/api/income-sources', ['name' => 'Gaji']);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_different_users_can_have_income_source_with_same_name(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        IncomeSource::factory()->for($userA)->create(['name' => 'Gaji']);

        Sanctum::actingAs($userB);

        $response = $this->postJson('/api/income-sources', ['name' => 'Gaji']);

        $response->assertStatus(201);
    }

    public function test_user_only_sees_their_own_income_sources(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        IncomeSource::factory()->for($userA)->create(['name' => 'Gaji A']);
        IncomeSource::factory()->for($userB)->create(['name' => 'Gaji B']);

        Sanctum::actingAs($userA);

        $response = $this->getJson('/api/income-sources');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Gaji A');
    }

    public function test_user_cannot_view_another_users_income_source_detail(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $incomeSource = IncomeSource::factory()->for($userB)->create();

        Sanctum::actingAs($userA);

        $response = $this->getJson("/api/income-sources/{$incomeSource->id}");

        $response->assertStatus(404);
    }

    public function test_user_can_update_their_own_income_source(): void
    {
        $user = User::factory()->create();
        $incomeSource = IncomeSource::factory()->for($user)->create(['name' => 'Gaji']);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/income-sources/{$incomeSource->id}", [
            'name' => 'Gaji Pokok',
            'is_active' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Gaji Pokok')
            ->assertJsonPath('data.is_active', false);
    }

    public function test_user_can_delete_their_own_income_source(): void
    {
        $user = User::factory()->create();
        $incomeSource = IncomeSource::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $response = $this->deleteJson("/api/income-sources/{$incomeSource->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('income_sources', ['id' => $incomeSource->id]);
    }

    public function test_search_filter_matches_name_or_description(): void
    {
        $user = User::factory()->create();
        IncomeSource::factory()->for($user)->create(['name' => 'Gaji', 'description' => 'Bulanan']);
        IncomeSource::factory()->for($user)->create(['name' => 'Bonus', 'description' => 'Tahunan']);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/income-sources?search=Bonus');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Bonus');
    }

    public function test_is_active_filter_works(): void
    {
        $user = User::factory()->create();
        IncomeSource::factory()->for($user)->create(['is_active' => true]);
        IncomeSource::factory()->for($user)->create(['is_active' => false]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/income-sources?is_active=0');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_active', false);
    }
}
