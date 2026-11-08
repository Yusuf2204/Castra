<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\ExpenseTransaction;
use App\Models\IncomeSource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AccountAndTransferTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_list_and_create_accounts(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/accounts', [
                'name' => 'Kas Kecil Kantor',
                'type' => 'petty_cash',
                'currency' => 'IDR',
                'initial_balance' => 1000000,
                'imprest_limit' => 3000000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Kas Kecil Kantor')
            ->assertJsonPath('data.current_balance', 1000000);

        $list = $this->actingAs($this->user)
            ->getJson('/api/accounts?all=1');

        $list->assertStatus(200)
            ->assertJsonPath('summary.total_balance', 1000000)
            ->assertJsonPath('summary.petty_cash_balance', 1000000);
    }

    public function test_account_recalculates_balance_from_incomes_expenses_and_transfers(): void
    {
        $account = Account::create([
            'user_id' => $this->user->id,
            'name' => 'Petty Cash',
            'type' => 'petty_cash',
            'initial_balance' => 500000,
            'current_balance' => 500000,
            'is_active' => true,
        ]);

        $source = IncomeSource::create([
            'user_id' => $this->user->id,
            'name' => 'Bank BCA',
            'is_active' => true,
        ]);

        $category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'ATK',
            'type' => 'expense',
            'is_active' => true,
        ]);

        // Income +200.000
        $this->actingAs($this->user)->postJson('/api/incomes', [
            'account_id' => $account->id,
            'income_source_id' => $source->id,
            'transaction_date' => '2026-11-08',
            'amount' => 200000,
            'notes' => 'Top up',
        ])->assertStatus(201);

        $this->assertEquals(700000, $account->fresh()->current_balance);

        // Expense -50.000
        $this->actingAs($this->user)->postJson('/api/expenses', [
            'account_id' => $account->id,
            'category_id' => $category->id,
            'transaction_date' => '2026-11-08',
            'amount' => 50000,
            'payee' => 'Toko Buku',
        ])->assertStatus(201);

        $this->assertEquals(650000, $account->fresh()->current_balance);
    }

    public function test_user_can_transfer_funds_between_accounts(): void
    {
        $bank = Account::create([
            'user_id' => $this->user->id,
            'name' => 'Bank BCA',
            'type' => 'bank',
            'initial_balance' => 5000000,
            'current_balance' => 5000000,
            'is_active' => true,
        ]);

        $petty = Account::create([
            'user_id' => $this->user->id,
            'name' => 'Kas Kecil',
            'type' => 'petty_cash',
            'initial_balance' => 0,
            'current_balance' => 0,
            'is_active' => true,
        ]);

        $fakeSlip = UploadedFile::fake()->create('slip_bank.pdf', 150, 'application/pdf');

        $response = $this->actingAs($this->user)->postJson('/api/fund-transfers', [
            'from_account_id' => $bank->id,
            'to_account_id' => $petty->id,
            'transfer_date' => '2026-11-08',
            'amount' => 2000000,
            'notes' => 'Pengisian Dana Kas Kecil',
            'attachment' => $fakeSlip,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.amount', 2000000)
            ->assertJsonPath('data.notes', 'Pengisian Dana Kas Kecil');

        $this->assertNotNull($response->json('data.attachment_path'));
        $this->assertNotNull($response->json('data.attachment_url'));

        $this->assertEquals(3000000, $bank->fresh()->current_balance);
        $this->assertEquals(2000000, $petty->fresh()->current_balance);
    }

    public function test_account_with_transactions_cannot_be_deleted(): void
    {
        $account = Account::create([
            'user_id' => $this->user->id,
            'name' => 'Kas',
            'type' => 'cash',
            'initial_balance' => 100000,
            'current_balance' => 100000,
            'is_active' => true,
        ]);

        $category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Belanja',
            'type' => 'expense',
            'is_active' => true,
        ]);

        ExpenseTransaction::create([
            'user_id' => $this->user->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'transaction_date' => '2026-11-08',
            'amount' => 10000,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/accounts/{$account->id}");
        $response->assertStatus(422);

        $this->assertDatabaseHas('ms_accounts', ['id' => $account->id]);
    }
}
