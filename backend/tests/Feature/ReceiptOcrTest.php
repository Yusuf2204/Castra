<?php

namespace Tests\Feature;

use App\Models\BudgetGroup;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ReceiptOcrTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $group = BudgetGroup::create([
            'user_id' => $this->user->id,
            'code' => 'NEED',
            'name' => 'Kebutuhan Pokok',
            'percentage' => 50,
            'is_system' => true,
        ]);

        $this->category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Makanan & Minuman',
            'type' => 'expense',
            'budget_group_id' => $group->id,
            'monthly_estimate' => 1500000,
        ]);
    }

    public function test_scan_receipt_requires_file(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/expenses/scan-receipt', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['receipt']);
    }

    public function test_scan_receipt_extracts_data_successfully(): void
    {
        // Generate synthetic receipt image using GD
        $im = imagecreatetruecolor(400, 250);
        $bg = imagecolorallocate($im, 255, 255, 255);
        $black = imagecolorallocate($im, 0, 0, 0);
        imagefilledrectangle($im, 0, 0, 400, 250, $bg);
        imagestring($im, 5, 80, 20, "WARUNG MAKAN SEDAP", $black);
        imagestring($im, 4, 60, 70, "TANGGAL: 21/10/2026", $black);
        imagestring($im, 4, 40, 120, "NASI AYAM BAKAR        25.000", $black);
        imagestring($im, 4, 40, 150, "ES TEH MANIS            5.000", $black);
        imagestring($im, 5, 40, 190, "TOTAL BAYAR : Rp 30.000", $black);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_rcpt_') . '.png';
        imagepng($im, $tempFile);
        imagedestroy($im);

        $uploadedFile = new UploadedFile(
            $tempFile,
            'receipt.png',
            'image/png',
            null,
            true
        );

        $response = $this->actingAs($this->user)
            ->postJson('/api/expenses/scan-receipt', [
                'receipt' => $uploadedFile,
            ]);

        @unlink($tempFile);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Nota berhasil dipindai')
            ->assertJsonPath('data.amount', 30000)
            ->assertJsonPath('data.transaction_date', '2026-10-21')
            ->assertJsonPath('data.merchant', 'WARUNG MAKAN SEDAP')
            ->assertJsonPath('data.suggested_category_id', $this->category->id);
    }

    public function test_scan_receipt_handles_subtotal_discount_and_service_fees(): void
    {
        $fixturePath = base_path('tests/Fixtures/nota.png');
        if (!file_exists($fixturePath)) {
            $this->markTestSkipped('Fixture nota.png not found');
        }

        $uploadedFile = new UploadedFile(
            $fixturePath,
            'nota.png',
            'image/png',
            null,
            true
        );

        $response = $this->actingAs($this->user)
            ->postJson('/api/expenses/scan-receipt', [
                'receipt' => $uploadedFile,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.amount', 53400)
            ->assertJsonPath('data.suggested_category_id', $this->category->id);
    }

    public function test_scan_income_proof_extracts_data_successfully(): void
    {
        $incomeSource = \App\Models\IncomeSource::create([
            'user_id' => $this->user->id,
            'name' => 'Gaji PT Maju Mundur',
            'is_active' => true,
        ]);

        $incomeCategory = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Gaji Pokok',
            'type' => 'income',
            'is_active' => true,
        ]);

        // Generate synthetic transfer proof image using GD
        $im = imagecreatetruecolor(400, 220);
        $bg = imagecolorallocate($im, 255, 255, 255);
        $black = imagecolorallocate($im, 0, 0, 0);
        imagefilledrectangle($im, 0, 0, 400, 220, $bg);
        imagestring($im, 5, 80, 20, "TRANSFER BERHASIL", $black);
        imagestring($im, 4, 40, 60, "PENGIRIM: PT MAJU MUNDUR", $black);
        imagestring($im, 4, 40, 100, "TANGGAL: 21/10/2026", $black);
        imagestring($im, 5, 40, 140, "JUMLAH TRANSFER: Rp 8.500.000", $black);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_inc_') . '.png';
        imagepng($im, $tempFile);
        imagedestroy($im);

        $uploadedFile = new UploadedFile(
            $tempFile,
            'transfer.png',
            'image/png',
            null,
            true
        );

        $response = $this->actingAs($this->user)
            ->postJson('/api/incomes/scan-receipt', [
                'receipt' => $uploadedFile,
            ]);

        @unlink($tempFile);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Bukti pemasukan berhasil dipindai')
            ->assertJsonPath('data.amount', 8500000)
            ->assertJsonPath('data.transaction_date', '2026-10-21')
            ->assertJsonPath('data.suggested_income_source_id', $incomeSource->id)
            ->assertJsonPath('data.suggested_category_id', $incomeCategory->id);
    }
}

