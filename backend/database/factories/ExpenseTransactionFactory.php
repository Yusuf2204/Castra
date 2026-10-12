<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\ExpenseTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExpenseTransaction>
 */
class ExpenseTransactionFactory extends Factory
{
    protected $model = ExpenseTransaction::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => Category::factory()->state(['type' => 'expense']),
            'transaction_date' => fake()->date(),
            'amount' => fake()->randomFloat(2, 10000, 5000000),
            'notes' => fake()->sentence(),
        ];
    }
}
