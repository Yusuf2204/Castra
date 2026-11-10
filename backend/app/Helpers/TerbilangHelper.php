<?php

namespace App\Helpers;

class TerbilangHelper
{
    private static array $satuan = [
        '',
        'Satu',
        'Dua',
        'Tiga',
        'Empat',
        'Lima',
        'Enam',
        'Tujuh',
        'Delapan',
        'Sembilan',
        'Sepuluh',
        'Sebelas',
    ];

    public static function make(float|int|string|null $number, string $suffix = 'Rupiah'): string
    {
        if ($number === null || $number === '') {
            return 'Nol ' . $suffix;
        }

        $num = (float) $number;

        if ($num == 0) {
            return 'Nol ' . $suffix;
        }

        $isNegative = $num < 0;
        $num = abs($num);

        $intPart = (int) floor($num);
        $decimalPart = (int) round(($num - $intPart) * 100);

        $words = self::convert($intPart);

        if ($isNegative) {
            $words = 'Minus ' . $words;
        }

        if ($decimalPart > 0) {
            $words .= ' Koma ' . self::convert($decimalPart) . ' Sen';
        }

        if ($suffix !== '') {
            $words .= ' ' . $suffix;
        }

        return trim(preg_replace('/\s+/', ' ', $words));
    }

    private static function convert(int $n): string
    {
        if ($n < 12) {
            return self::$satuan[$n];
        }

        if ($n < 20) {
            return self::convert($n - 10) . ' Belas';
        }

        if ($n < 100) {
            $sisa = $n % 10;
            return self::convert((int) ($n / 10)) . ' Puluh ' . ($sisa > 0 ? self::convert($sisa) : '');
        }

        if ($n < 200) {
            $sisa = $n - 100;
            return 'Seratus ' . ($sisa > 0 ? self::convert($sisa) : '');
        }

        if ($n < 1000) {
            $sisa = $n % 100;
            return self::convert((int) ($n / 100)) . ' Ratus ' . ($sisa > 0 ? self::convert($sisa) : '');
        }

        if ($n < 2000) {
            $sisa = $n - 1000;
            return 'Seribu ' . ($sisa > 0 ? self::convert($sisa) : '');
        }

        if ($n < 1000000) {
            $sisa = $n % 1000;
            return self::convert((int) ($n / 1000)) . ' Ribu ' . ($sisa > 0 ? self::convert($sisa) : '');
        }

        if ($n < 1000000000) {
            $sisa = $n % 1000000;
            return self::convert((int) ($n / 1000000)) . ' Juta ' . ($sisa > 0 ? self::convert($sisa) : '');
        }

        if ($n < 1000000000000) {
            $sisa = $n % 1000000000;
            return self::convert((int) ($n / 1000000000)) . ' Miliar ' . ($sisa > 0 ? self::convert($sisa) : '');
        }

        $sisa = $n % 1000000000000;
        return self::convert((int) ($n / 1000000000000)) . ' Triliun ' . ($sisa > 0 ? self::convert($sisa) : '');
    }
}
