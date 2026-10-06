<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds for all master data based on reference sheet.
     */
    public function run(): void
    {
        $this->call([
            BudgetGroupSeeder::class,
            IncomeSourceSeeder::class,
            CategorySeeder::class,
        ]);
    }
}

