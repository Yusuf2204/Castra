<?php

namespace Database\Seeders;

use App\Models\IncomeSource;
use App\Models\User;
use Illuminate\Database\Seeder;

class IncomeSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds income sources based on reference sheet (Gaji & common account wallets)
     * scoped per user.
     */
    public function run(): void
    {
        $defaultSources = [
            [
                'name' => 'Gaji',
                'description' => 'Rekening penerimaan gaji bulanan utama',
                'is_active' => true,
            ],
            [
                'name' => 'Dompet Tunai',
                'description' => 'Uang tunai fisik untuk kebutuhan operasional harian',
                'is_active' => true,
            ],
            [
                'name' => 'Rekening Tabungan',
                'description' => 'Rekening bank simpanan dana darurat & investasi',
                'is_active' => true,
            ],
            [
                'name' => 'E-Wallet',
                'description' => 'Dompet digital (GoPay / OVO / ShopeePay / DANA)',
                'is_active' => true,
            ],
        ];

        $users = User::all();

        foreach ($users as $user) {
            foreach ($defaultSources as $source) {
                IncomeSource::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'name' => $source['name'],
                    ],
                    [
                        'description' => $source['description'],
                        'is_active' => $source['is_active'],
                    ]
                );
            }
        }
    }
}

