<?php

namespace Database\Factories;

use App\Models\BudgetGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BudgetGroup>
 */
class BudgetGroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'code' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'percentage' => 25.00,
            'sort_order' => 1,
            'is_system' => false,
            'is_active' => true,
        ];
    }
}
