<?php

namespace App\Services;

use App\Models\Category;
use App\Models\IncomeSource;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class ReceiptOcrService
{
    /**
     * Scan and parse receipt image into structured transaction data.
     *
     * @param UploadedFile $file
     * @param \App\Models\User $user
     * @return array
     */
    public function scan(UploadedFile $file, $user): array
    {
        $originalPath = $file->getRealPath();
        $preprocessedPath = $this->preprocessImage($originalPath);

        try {
            $rawText = $this->extractText($preprocessedPath);
        } finally {
            if ($preprocessedPath && file_exists($preprocessedPath) && $preprocessedPath !== $originalPath) {
                @unlink($preprocessedPath);
            }
        }

        return $this->parseReceipt($rawText, $user);
    }

    /**
     * Scan an uploaded receipt or transfer proof image for Income transactions.
     *
     * @param UploadedFile $file
     * @param \App\Models\User $user
     * @return array
     */
    public function scanIncome(UploadedFile $file, $user): array
    {
        $originalPath = $file->getRealPath();
        $preprocessedPath = $this->preprocessImage($originalPath);

        try {
            $rawText = $this->extractText($preprocessedPath);
        } finally {
            if ($preprocessedPath && file_exists($preprocessedPath) && $preprocessedPath !== $originalPath) {
                @unlink($preprocessedPath);
            }
        }

        return $this->parseIncome($rawText, $user);
    }

    /**
     * Preprocess image for maximum Tesseract OCR accuracy.
     * Grayscale conversion, contrast enhancement, and 2x upscaling if image is small.
     */
    protected function preprocessImage(string $sourcePath): string
    {
        if (!extension_loaded('gd')) {
            return $sourcePath;
        }

        $imageInfo = @getimagesize($sourcePath);
        if (!$imageInfo) {
            return $sourcePath;
        }

        $mime = $imageInfo['mime'] ?? '';
        $src = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png' => @imagecreatefrompng($sourcePath),
            'image/webp' => @imagecreatefromwebp($sourcePath),
            default => null,
        };

        if (!$src) {
            return $sourcePath;
        }

        $origW = imagesx($src);
        $origH = imagesy($src);

        // Upscale if smaller than 1200px
        $scaleFactor = 1;
        if ($origW < 1200 || $origH < 1200) {
            $scaleFactor = 2;
        }

        $newW = (int) ($origW * $scaleFactor);
        $newH = (int) ($origH * $scaleFactor);

        $processed = imagecreatetruecolor($newW, $newH);
        imagecopyresampled($processed, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);
        imagedestroy($src);

        // Convert to grayscale
        imagefilter($processed, IMG_FILTER_GRAYSCALE);

        // Enhance contrast (negative value in GD increases contrast)
        imagefilter($processed, IMG_FILTER_CONTRAST, -30);

        $tempPath = tempnam(sys_get_temp_dir(), 'castra_ocr_') . '.png';
        imagepng($processed, $tempPath);
        imagedestroy($processed);

        return $tempPath;
    }

    /**
     * Run Tesseract OCR command on the image file.
     */
    protected function extractText(string $imagePath): string
    {
        $escapedPath = escapeshellarg($imagePath);
        // Language order: ind+eng, PSM 6 (single uniform block of text) or PSM 4 / 3
        $command = "tesseract {$escapedPath} stdout -l ind+eng --oem 1 --psm 6 2>/dev/null";
        $output = shell_exec($command);

        if (!$output || trim($output) === '') {
            // Fallback to auto page segmentation (PSM 3)
            $command = "tesseract {$escapedPath} stdout -l ind+eng --oem 1 --psm 3 2>/dev/null";
            $output = shell_exec($command);
        }

        return $output ? trim($output) : '';
    }

    /**
     * Extract structured fields (amount, date, merchant, suggested category) from OCR text.
     */
    public function parseReceipt(string $rawText, $user): array
    {
        $amount = $this->parseAmount($rawText);
        $date = $this->parseDate($rawText);
        $merchant = $this->parseMerchant($rawText);
        $category = $this->suggestCategory($rawText, $merchant, $user);

        return [
            'amount' => $amount,
            'transaction_date' => $date,
            'merchant' => $merchant,
            'notes' => $merchant,
            'suggested_category_id' => $category?->id,
            'suggested_category_name' => $category?->name,
            'raw_text' => $rawText,
        ];
    }

    /**
     * Extract structured fields from OCR text for Income transactions.
     */
    public function parseIncome(string $rawText, $user): array
    {
        $amount = $this->parseAmount($rawText);
        $date = $this->parseDate($rawText);
        $sender = $this->parseMerchant($rawText);
        $incomeSource = $this->suggestIncomeSource($rawText, $sender, $user);
        $category = $this->suggestIncomeCategory($rawText, $sender, $user);

        $notes = $sender !== 'Pengeluaran Nota' ? $sender : 'Pemasukan';

        return [
            'amount' => $amount,
            'transaction_date' => $date,
            'merchant' => $sender,
            'notes' => $notes,
            'suggested_income_source_id' => $incomeSource?->id,
            'suggested_income_source_name' => $incomeSource?->name,
            'suggested_category_id' => $category?->id,
            'suggested_category_name' => $category?->name,
            'raw_text' => $rawText,
        ];
    }

    /**
     * Detect total transaction amount from receipt text.
     * Handles complex breakdowns: subtotal, before-prices, vouchers/discounts, fees, and final settlement.
     */
    protected function parseAmount(string $text): ?float
    {
        $lines = array_values(array_filter(array_map('trim', explode("\n", $text))));
        if (empty($lines)) {
            return null;
        }

        // Keywords that definitively indicate the FINAL net amount payable
        $highPriorityKeywords = [
            'grand total',
            'total bayar',
            'total akhir',
            'total pembayaran',
            'total tagihan',
            'total transaksi',
            'total pesanan',
            'jumlah bayar',
            'jumlah tagihan',
            'net total',
            'netto',
        ];

        // Keywords indicating discounts, subtotals, or intermediate sums (must be excluded from final total)
        $excludeKeywords = [
            'subtotal',
            'sub total',
            'sebelum diskon',
            'sebelum promo',
            'diskon',
            'discount',
            'voucher',
            'promo',
            'hemat',
            'potongan',
            'cashback',
            'kembali',
            'kembalian',
            'change',
            'harga normal',
            'harga coret',
        ];

        // Payment settlement keywords
        $paymentKeywords = [
            'total',
            'tunai',
            'cash',
            'qris',
            'gopay',
            'shopeepay',
            'ovo',
            'dana',
            'debit',
            'kartu kredit',
            'credit card',
        ];

        // 1. High priority keywords scanned from bottom-up (final total is always at bottom)
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $line = $lines[$i];
            $lower = strtolower($line);

            if ($this->containsAnyKeyword($lower, $excludeKeywords)) {
                continue;
            }

            foreach ($highPriorityKeywords as $kw) {
                if (str_contains($lower, $kw)) {
                    $amount = $this->extractEffectiveAmountFromLine($line);
                    if ($amount !== null) {
                        return $amount;
                    }
                }
            }
        }

        // 2. Standalone currency lines from bottom-up (common in GoFood/ShopeeFood/GrabFood receipts)
        // e.g. "Rp53.400" right above "Sudah termasuk pajak" or below fees/discounts breakdown
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $line = $lines[$i];
            $lower = strtolower($line);

            if (str_contains($lower, 'pajak') || str_contains($lower, 'terima kasih') || str_contains($lower, 'tax')) {
                continue;
            }

            if ($this->containsAnyKeyword($lower, $excludeKeywords)) {
                continue;
            }

            // Standalone or trailing price on the line
            if (preg_match('/^(?:rp\.?|idr)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]{4,})$/i', $line, $m)) {
                $val = $this->normalizeNumeric($m[1]);
                if ($val > 100 && $val < 9999999999999.99) {
                    return $val;
                }
            }
        }

        // 3. Payment methods or 'total' scanned from bottom-up
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $line = $lines[$i];
            $lower = strtolower($line);

            if ($this->containsAnyKeyword($lower, $excludeKeywords)) {
                continue;
            }

            foreach ($paymentKeywords as $kw) {
                if (str_contains($lower, $kw)) {
                    $amount = $this->extractEffectiveAmountFromLine($line);
                    if ($amount !== null) {
                        return $amount;
                    }
                }
            }
        }

        // 4. Fallback: Search all currency numbers in bottom section of the receipt
        $totalLines = count($lines);
        $bottomLines = array_slice($lines, (int) ($totalLines * 0.4));
        $candidates = [];

        foreach (array_reverse($bottomLines) as $bLine) {
            $bLower = strtolower($bLine);
            if ($this->containsAnyKeyword($bLower, array_merge($excludeKeywords, ['pajak', 'terima kasih']))) {
                continue;
            }

            $amount = $this->extractEffectiveAmountFromLine($bLine);
            if ($amount !== null) {
                $candidates[] = $amount;
            }
        }

        if (!empty($candidates)) {
            return $candidates[0];
        }

        // 5. Absolute last fallback: subtotal if nothing else was found
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $lower = strtolower($lines[$i]);
            if (str_contains($lower, 'subtotal') || str_contains($lower, 'sub total')) {
                $amount = $this->extractEffectiveAmountFromLine($lines[$i]);
                if ($amount !== null) {
                    return $amount;
                }
            }
        }

        return null;
    }

    /**
     * Check if string contains any of the provided keywords.
     */
    protected function containsAnyKeyword(string $text, array $keywords): bool
    {
        foreach ($keywords as $kw) {
            if (str_contains($text, $kw)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extract the effective amount from a line.
     * When multiple prices exist on the line (e.g. struck-through before-price and after-price),
     * picks the LAST price on the line.
     */
    protected function extractEffectiveAmountFromLine(string $line): ?float
    {
        if (preg_match_all('/(?:rp\.?|idr)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?|[0-9]{4,})/i', $line, $matches)) {
            $lastNum = end($matches[1]);
            $val = $this->normalizeNumeric($lastNum);
            if ($val > 100 && $val < 9999999999999.99) {
                return $val;
            }
        }

        return null;
    }

    /**
     * Normalize formatted numeric string (Indonesian or International format) into float.
     */
    protected function normalizeNumeric(string $numStr): float
    {
        $clean = trim(str_replace(' ', '', $numStr));

        if (str_contains($clean, '.') && str_contains($clean, ',')) {
            if (preg_match('/,[0-9]{2}$/', $clean)) {
                // Indonesian format with cents: 36.500,00 -> 36500.00
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } elseif (preg_match('/\.[0-9]{2}$/', $clean)) {
                // International format with cents: 36,500.00 -> 36500.00
                $clean = str_replace(',', '', $clean);
            } else {
                // OCR mixed dots and commas: 8.500,000 -> 8500000
                $clean = str_replace(['.', ','], '', $clean);
            }
        } elseif (substr_count($clean, '.') > 1) {
            // 1.500.000 -> 1500000
            $clean = str_replace('.', '', $clean);
        } elseif (substr_count($clean, ',') > 1) {
            // 1,500,000 -> 1500000
            $clean = str_replace(',', '', $clean);
        } elseif (preg_match('/\.[0-9]{3}$/', $clean)) {
            // 36.500 -> 36500
            $clean = str_replace('.', '', $clean);
        } elseif (preg_match('/,[0-9]{3}$/', $clean)) {
            // 36,500 -> 36500
            $clean = str_replace(',', '', $clean);
        } elseif (str_contains($clean, ',')) {
            // 36,50 -> 36.50
            $clean = str_replace(',', '.', $clean);
        }

        return (float) $clean;
    }

    /**
     * Detect transaction date from receipt text.
     */
    protected function parseDate(string $text): string
    {
        // 1. DD/MM/YYYY or DD-MM-YYYY
        if (preg_match('/\b([0-3]?[0-9])[\/\-.]([0-1]?[0-9])[\/\-.](20[2-3][0-9])\b/', $text, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }

        // 2. YYYY/MM/DD or YYYY-MM-DD
        if (preg_match('/\b(20[2-3][0-9])[\/\-.]([0-1]?[0-9])[\/\-.]([0-3]?[0-9])\b/', $text, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[1], (int) $m[2], (int) $m[3]);
        }

        // 3. DD/MM/YY format (e.g. 21/10/26)
        if (preg_match('/\b([0-3]?[0-9])[\/\-.]([0-1]?[0-9])[\/\-.](2[4-9]|3[0-5])\b/', $text, $m)) {
            return sprintf('20%02d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }

        // 4. Month name format: 21 Okt 2026 or 21 October 2026
        $months = [
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4,
            'mei' => 5, 'may' => 5, 'jun' => 6, 'jul' => 7,
            'agu' => 8, 'aug' => 8, 'sep' => 9, 'okt' => 10,
            'oct' => 10, 'nov' => 11, 'des' => 12, 'dec' => 12,
        ];
        if (preg_match('/\b([0-3]?[0-9])\s+([A-Za-z]{3,9})\s+(20[2-3][0-9])\b/i', $text, $m)) {
            $prefix = strtolower(substr($m[2], 0, 3));
            if (isset($months[$prefix])) {
                return sprintf('%04d-%02d-%02d', (int) $m[3], $months[$prefix], (int) $m[1]);
            }
        }

        return date('Y-m-d');
    }

    /**
     * Extract merchant name or main items purchased from receipt text.
     */
    protected function parseMerchant(string $text): string
    {
        $lines = array_values(array_filter(array_map('trim', explode("\n", $text))));

        $ignorePatterns = [
            '/selamat datang/i',
            '/terima kasih/i',
            '/thank you/i',
            '/npwp/i',
            '/receipt/i',
            '/struk/i',
            '/order/i',
            '/kasir/i',
            '/cashier/i',
            '/bill/i',
            '/invoice/i',
            '/nota/i',
            '/customer/i',
            '/meja/i',
            '/table/i',
            '/tanggal/i',
            '/date/i',
            '/waktu/i',
            '/time/i',
            '/rincian pesanan/i',
            '/ringkasan pesanan/i',
            '/detail pesanan/i',
            '/daftar pesanan/i',
            '/rincian pembayaran/i',
            '/subtotal/i',
            '/^[0-9\/\-:\s.]+$/',
        ];

        $candidateItems = [];

        foreach (array_slice($lines, 0, 10) as $line) {
            if (mb_strlen($line) < 3) {
                continue;
            }

            $skip = false;
            foreach ($ignorePatterns as $pattern) {
                if (preg_match($pattern, $line)) {
                    $skip = true;
                    break;
                }
            }

            if ($skip) {
                continue;
            }

            // Check if this line looks like a Store/Merchant header (e.g. "WARUNG MAKAN SEDAP", "KOPI KENANGAN")
            // A store header doesn't start with item quantities and doesn't end with a price
            $hasQuantity = (bool) preg_match('/^[a-z0-9\s]*?[0-9]+\s*[xX*]/i', $line);
            $hasPrice = (bool) preg_match('/(?:rp\.?|idr)?\s*[0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?$/i', $line);

            if (!$hasQuantity && !$hasPrice && empty($candidateItems)) {
                $cleaned = trim(preg_replace('/[^\p{L}\p{N}\s\-\.&]/u', '', $line));
                if (mb_strlen($cleaned) >= 3) {
                    return $cleaned;
                }
            }

            // Otherwise, it's an item line (e.g. "H 2x Ketoprak Spesial Telor Rp52.000")
            // Clean trailing price:
            $cleaned = preg_replace('/(?:rp\.?|idr)?\s*[0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?$/i', '', $line);
            // Clean leading quantities or OCR artifacts:
            $cleaned = preg_replace('/^[a-z0-9\s]*?[0-9]+\s*[xX*]\s*/i', '', $cleaned);
            // Clean punctuation
            $cleaned = trim(preg_replace('/[^\p{L}\p{N}\s\-\.&]/u', '', $cleaned));

            // Exclude note lines like "Pedas , Telur Ceplok"
            if (mb_strlen($cleaned) >= 3 && !preg_match('/^(pedas|sedang|manis|ceplok|dadar|level|porsi)/i', $cleaned)) {
                $candidateItems[] = $cleaned;
            }
        }

        if (!empty($candidateItems)) {
            return implode(', ', array_slice($candidateItems, 0, 2));
        }

        return 'Pengeluaran Nota';
    }

    /**
     * Suggest user's expense category based on semantic receipt keywords.
     */
    protected function suggestCategory(string $text, string $merchant, $user): ?Category
    {
        $userCategories = Category::where('user_id', $user->id)
            ->where('type', 'expense')
            ->where('is_active', true)
            ->get();

        if ($userCategories->isEmpty()) {
            return null;
        }

        $haystack = strtolower("{$merchant} {$text}");

        // Rule mappings: keywords -> category name substrings
        $rules = [
            'makan' => [
                'makan', 'minum', 'kopi', 'cafe', 'resto', 'bakso', 'ayam', 'mie', 'bread',
                'roti', 'snack', 'food', 'warung', 'soto', 'ketoprak', 'gorengan', 'gofood',
                'grabfood', 'shopeefood', 'martabak', 'geprek', 'nasi', 'bebek', 'pizza', 'burger'
            ],
            'transport' => ['spbu', 'pertamina', 'shell', 'bensin', 'pertalite', 'pertamax', 'parkir', 'toll', 'tol', 'gojek', 'grab', 'ojek'],
            'belanja' => ['indomaret', 'alfamart', 'superindo', 'hypermart', 'yomart', 'transmart', 'sabun', 'shampoo', 'sembako', 'minimarket'],
            'kesehatan' => ['apotek', 'obat', 'klinik', 'dokter', 'kimia farma', 'k24', 'guardian', 'watsons'],
            'hiburan' => ['bioskop', 'cinema', 'xxi', 'cgv', 'game', 'playstation', 'tiket', 'konser'],
            'tagihan' => ['pln', 'listrik', 'pdam', 'air', 'indihome', 'wifi', 'internet', 'telkom', 'bpjs', 'pulsa'],
        ];

        foreach ($rules as $categoryType => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($haystack, $kw)) {
                    // Find matching category in user's categories
                    $matched = $userCategories->first(function ($cat) use ($categoryType, $kw) {
                        $catName = strtolower($cat->name);
                        return str_contains($catName, $categoryType) || str_contains($catName, $kw);
                    });

                    if ($matched) {
                        return $matched;
                    }
                }
            }
        }

        // Default to first active category if no specific rule matched
        return $userCategories->first();
    }

    /**
     * Suggest user's income source based on proof/receipt text.
     */
    protected function suggestIncomeSource(string $text, string $sender, $user): ?IncomeSource
    {
        $sources = IncomeSource::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        if ($sources->isEmpty()) {
            return null;
        }

        $haystack = strtolower("{$sender} {$text}");

        // Common income source keywords
        $sourceKeywords = [
            'gaji' => ['gaji', 'payroll', 'salary', 'pt', 'cv', 'honor', 'upah'],
            'freelance' => ['freelance', 'project', 'proyek', 'klien', 'client', 'jasa'],
            'bisnis' => ['bisnis', 'toko', 'omzet', 'jualan', 'penjualan', 'usaha'],
            'investasi' => ['investasi', 'dividen', 'reksadana', 'saham', 'crypto', 'deposito', 'bunga', 'profit'],
            'bca' => ['bca', 'bank central asia', 'klikbca', 'mybca', 'm-bca'],
            'mandiri' => ['mandiri', 'livin', 'bank mandiri'],
            'bri' => ['bri', 'brimo', 'bank rakyat indonesia'],
            'bni' => ['bni', 'bni mobile'],
            'jago' => ['jago', 'bank jago'],
            'seabank' => ['seabank', 'sea bank'],
            'dana' => ['dana'],
            'gopay' => ['gopay', 'gojek'],
            'ovo' => ['ovo'],
        ];

        foreach ($sourceKeywords as $key => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($haystack, $kw)) {
                    $matched = $sources->first(function ($src) use ($key, $kw) {
                        $srcName = strtolower($src->name);
                        return str_contains($srcName, $key) || str_contains($srcName, $kw);
                    });

                    if ($matched) {
                        return $matched;
                    }
                }
            }
        }

        foreach ($sources as $source) {
            $srcName = strtolower($source->name);
            if (mb_strlen($srcName) >= 3 && str_contains($haystack, $srcName)) {
                return $source;
            }
        }

        return $sources->first();
    }

    /**
     * Suggest user's income category based on proof/receipt text.
     */
    protected function suggestIncomeCategory(string $text, string $sender, $user): ?Category
    {
        $categories = Category::where('user_id', $user->id)
            ->where('type', 'income')
            ->where('is_active', true)
            ->get();

        if ($categories->isEmpty()) {
            return null;
        }

        $haystack = strtolower("{$sender} {$text}");

        $rules = [
            'gaji' => ['gaji', 'payroll', 'salary', 'upah', 'honor', 'pt', 'cv'],
            'bonus' => ['bonus', 'tunjangan', 'thr', 'insentif', 'incentive', 'reward'],
            'investasi' => ['dividen', 'bunga', 'saham', 'reksadana', 'crypto', 'profit'],
            'lain' => ['pemasukan lainnya', 'transfer', 'hibah', 'hadiah', 'kembalian'],
        ];

        foreach ($rules as $type => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($haystack, $kw)) {
                    $matched = $categories->first(function ($cat) use ($type, $kw) {
                        $catName = strtolower($cat->name);
                        return str_contains($catName, $type) || str_contains($catName, $kw);
                    });

                    if ($matched) {
                        return $matched;
                    }
                }
            }
        }

        return $categories->first();
    }
}

