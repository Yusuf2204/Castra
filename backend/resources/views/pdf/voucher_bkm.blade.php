<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Voucher BKM - {{ $transaction->voucher_no ?? 'BKM' }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #111827;
            margin: 0;
            padding: 0;
        }
        .voucher-box {
            border: 2px solid #111827;
            padding: 18px 20px;
            background: #ffffff;
        }
        .title-section {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .title-section h2 {
            margin: 0;
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 3px 6px;
            vertical-align: top;
            font-size: 10pt;
        }
        .meta-label {
            width: 18%;
            font-weight: bold;
            color: #374151;
        }
        .meta-separator {
            width: 2%;
            text-align: center;
        }
        .meta-value {
            width: 30%;
        }
        .content-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 15px;
        }
        .content-table th,
        .content-table td {
            border: 1px solid #111827;
            padding: 7px 10px;
            font-size: 10pt;
        }
        .content-table th {
            background-color: #f3f4f6;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9.5pt;
        }
        .terbilang-box {
            border: 1px dashed #111827;
            background-color: #f9fafb;
            padding: 8px 12px;
            margin-bottom: 20px;
            font-size: 10pt;
        }
        .terbilang-title {
            font-weight: bold;
            color: #4b5563;
            text-transform: uppercase;
            font-size: 8.5pt;
            margin-bottom: 2px;
        }
        .terbilang-text {
            font-style: italic;
            font-weight: 600;
            color: #111827;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            page-break-inside: avoid;
        }
        .signatures-table td {
            border: 1px solid #111827;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 6px;
            font-size: 9.5pt;
        }
        .signatures-table .role-title {
            font-weight: bold;
            height: 20px;
        }
        .signatures-table .sign-space {
            height: 60px;
        }
        .signatures-table .name-space {
            font-weight: 600;
            border-top: 1px dotted #9ca3af;
            padding-top: 4px;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            font-size: 9pt;
            font-weight: bold;
            border: 1px solid #111827;
            border-radius: 3px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .receipt-page {
            page-break-before: always;
            padding-top: 10px;
        }
        .receipt-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #9ca3af;
            padding-bottom: 8px;
        }
        .receipt-image-container {
            text-align: center;
            margin-top: 10px;
        }
        .receipt-image {
            max-width: 90%;
            max-height: 650px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>

<div class="voucher-box">
    <!-- Header Title (Tanpa Kop Surat sesuai permintaan) -->
    <div class="title-section">
        <h2>BUKTI KAS MASUK (BKM)</h2>
    </div>

    <!-- Metadata Grid -->
    <table class="meta-table">
        <tr>
            <td class="meta-label">No. Bukti</td>
            <td class="meta-separator">:</td>
            <td class="meta-value">
                <strong>{{ $transaction->voucher_no ?? '-' }}</strong>
            </td>
            <td class="meta-label">Tanggal</td>
            <td class="meta-separator">:</td>
            <td class="meta-value">
                {{ \Carbon\Carbon::parse($transaction->transaction_date)->locale('id')->isoFormat('D MMMM Y') }}
            </td>
        </tr>
        <tr>
            <td class="meta-label">Diterima Dari</td>
            <td class="meta-separator">:</td>
            <td class="meta-value">
                <strong>{{ $transaction->category->name ?? ($transaction->incomeSource->name ?? ($transaction->payee ?? '-')) }}</strong>
            </td>
            <td class="meta-label">Masuk ke Akun</td>
            <td class="meta-separator">:</td>
            <td class="meta-value">
                {{ $transaction->account->name ?? '-' }}
            </td>
        </tr>
        <tr>
            <td class="meta-label">Status Dokumen</td>
            <td class="meta-separator">:</td>
            <td class="meta-value">
                <span class="badge">
                    {{ strtoupper($transaction->status ?? 'APPROVED') }}
                </span>
            </td>
            <td class="meta-label">Kategori Pemasukan</td>
            <td class="meta-separator">:</td>
            <td class="meta-value">
                {{ $transaction->category->name ?? '-' }}
            </td>
        </tr>
    </table>

    <!-- Rincian Transaksi Table -->
    <table class="content-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 50%;">Keterangan / Sumber Penerimaan</th>
                <th style="width: 20%;">Kategori</th>
                <th style="width: 25%;" class="text-right">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-center">1</td>
                <td>
                    {{ $transaction->notes ?? 'Penerimaan kas / transfer dana' }}
                    @if($transaction->incomeSource)
                        <div style="font-size: 8.5pt; color: #4b5563; margin-top: 2px;">
                            Sumber: {{ $transaction->incomeSource->name }}
                        </div>
                    @endif
                </td>
                <td>{{ $transaction->category->name ?? '-' }}</td>
                <td class="text-right">{{ number_format($transaction->amount, 0, ',', '.') }}</td>
            </tr>
        </tbody>
        <tfoot>
            <tr style="background-color: #f9fafb; font-weight: bold;">
                <td colspan="3" class="text-right" style="padding-right: 12px;">TOTAL KAS MASUK:</td>
                <td class="text-right" style="font-size: 11pt;">
                    Rp {{ number_format($transaction->amount, 0, ',', '.') }}
                </td>
            </tr>
        </tfoot>
    </table>

    <!-- Terbilang Box -->
    <div class="terbilang-box">
        <div class="terbilang-title">Terbilang :</div>
        <div class="terbilang-text"># {{ $terbilang }} #</div>
    </div>

    <!-- Kolom Tanda Tangan (3 Pihak Standar BKM Akuntansi) -->
    <table class="signatures-table">
        <tr>
            <td class="role-title">Penyetor / Diterima Dari</td>
            <td class="role-title">Diterima Kasir / Akuntansi</td>
            <td class="role-title">Disetujui Oleh</td>
        </tr>
        <tr>
            <td class="sign-space"></td>
            <td class="sign-space"></td>
            <td class="sign-space"></td>
        </tr>
        <tr>
            <td class="name-space">{{ $transaction->category->name ?? ($transaction->incomeSource->name ?? '( ........................ )') }}</td>
            <td class="name-space">{{ $transaction->user->name ?? '( ........................ )' }}</td>
            <td class="name-space">( ........................ )</td>
        </tr>
    </table>
</div>

<!-- Lampiran Bukti Transfer jika ada gambar dan diminta -->
@if(!empty($receiptBase64))
    <div class="receipt-page">
        <div class="receipt-header">
            <h3 style="margin: 0; font-size: 12pt; text-transform: uppercase;">Lampiran Bukti Transfer / Slip Masuk</h3>
            <div style="font-size: 9.5pt; color: #4b5563;">
                Lampiran untuk Voucher No: <strong>{{ $transaction->voucher_no ?? '-' }}</strong> | Tanggal: {{ $transaction->transaction_date }}
            </div>
        </div>
        <div class="receipt-image-container">
            <img src="{{ $receiptBase64 }}" class="receipt-image" alt="Bukti Transfer" />
        </div>
    </div>
@endif

</body>
</html>
