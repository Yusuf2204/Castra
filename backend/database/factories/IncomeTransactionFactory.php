<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\IncomeSource;
use App\Models\IncomeTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\IncomeTransaction>
 */
class IncomeTransactionFactory extends Factory
{
    protected $model = IncomeTransaction::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'income_source_id' => IncomeSource::factory(),
            'category_id' => Category::factory()->state(['type' => 'income']),
            'transaction_date' => fake()->date(),
            'amount' => fake()->randomFloat(2, 50000, 10000000),
            'notes' => fake()->sentence(),
        ];
    }
}
