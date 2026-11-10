<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Buku Kas - {{ $data['account']['name'] ?? 'Kas' }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm 12mm 10mm 12mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 8.5pt;
            line-height: 1.3;
            color: #111827;
            margin: 0;
            padding: 0;
        }
        .header-section {
            border-bottom: 2px solid #111827;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }
        .header-title {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
        }

        /* Summary Box */
        .summary-box {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .summary-box td {
            border: 1px solid #111827;
            padding: 5px 8px;
            text-align: center;
            background-color: #f9fafb;
        }
        .summary-label {
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #4b5563;
            margin-bottom: 1px;
        }
        .summary-value {
            font-size: 10pt;
            font-weight: bold;
            color: #111827;
        }
        .text-success { color: #059669; }
        .text-danger { color: #dc2626; }
        .text-primary { color: #2563eb; }

        /* Ledger Table */
        .ledger-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .ledger-table th,
        .ledger-table td {
            border: 1px solid #111827;
            padding: 4px 5px;
            font-size: 8pt;
        }
        .ledger-table th {
            background-color: #f3f4f6;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 7.5pt;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .fw-bold { font-weight: bold; }
        .text-muted { color: #6b7280; }

        /* Signatures */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .signatures-table td {
            border: 1px solid #111827;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 5px;
            font-size: 8pt;
        }
        .signatures-table .role-title {
            font-weight: bold;
            height: 16px;
        }
        .signatures-table .sign-space {
            height: 48px;
        }
        .signatures-table .name-space {
            font-weight: 600;
            border-top: 1px dotted #9ca3af;
            padding-top: 3px;
        }

        /* Appendix / Docket Styling */
        .appendix-header {
            border-bottom: 2px solid #111827;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .docket-pair-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            page-break-inside: avoid;
        }
        .docket-cell {
            width: 50%;
            vertical-align: top;
            padding: 0 5px;
            box-sizing: border-box;
        }
        .docket-card {
            border: 1.5px solid #111827;
            background: #ffffff;
            box-sizing: border-box;
            height: 162mm;
            overflow: hidden;
        }
        .docket-header {
            background-color: #f3f4f6;
            border-bottom: 1px solid #111827;
            padding: 6px 8px;
        }
        .docket-voucher-no {
            font-weight: bold;
            font-size: 9pt;
            color: #111827;
        }
        .docket-submeta {
            font-size: 7pt;
            color: #4b5563;
            margin-top: 1px;
        }
        .docket-amount {
            font-weight: bold;
            font-size: 9.5pt;
        }
        .docket-desc {
            font-size: 7pt;
            color: #1f2937;
            margin-top: 3px;
            line-height: 1.25;
            max-height: 24px;
            overflow: hidden;
        }
        .docket-img-container {
            text-align: center;
            padding: 6px;
            height: 130mm;
            vertical-align: middle;
            background-color: #fafafa;
            overflow: hidden;
        }
        .docket-img {
            max-width: 100%;
            max-height: 128mm;
            display: block;
            margin: 0 auto;
        }
        .docket-pdf-box {
            padding: 30px 15px;
            text-align: center;
            background: #ffffff;
            border: 1px dashed #d1d5db;
            margin-top: 25px;
        }
    </style>
</head>
<body>

    <!-- Header Section (Tanpa Kop Surat sesuai instruksi) -->
    <div class="header-section">
        <table style="width: 100%;">
            <tr>
                <td style="vertical-align: middle;">
                    <h2 class="header-title">LAPORAN BUKU KAS KECIL &amp; MUTASI KAS</h2>
                    <div style="font-size: 8pt; color: #4b5563;">
                        Laporan Pertanggungjawaban Mutasi Kas Operasional &bull; Castra Financial System
                    </div>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <div style="font-size: 10.5pt; font-weight: bold; color: #111827;">
                        {{ $data['account']['name'] ?? 'Kas Kecil' }}
                    </div>
                    <div style="font-size: 8pt; color: #4b5563;">
                        Periode: <strong>{{ \Carbon\Carbon::parse($data['period']['start_date'])->locale('id')->isoFormat('D MMMM Y') }}</strong> s/d <strong>{{ \Carbon\Carbon::parse($data['period']['end_date'])->locale('id')->isoFormat('D MMMM Y') }}</strong>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Executive Summary Box -->
    <table class="summary-box">
        <tr>
            <td style="width: 25%;">
                <div class="summary-label">Saldo Awal</div>
                <div class="summary-value">Rp {{ number_format($data['opening_balance'], 0, ',', '.') }}</div>
            </td>
            <td style="width: 25%;">
                <div class="summary-label">Total Masuk (Debet)</div>
                <div class="summary-value text-success">+Rp {{ number_format($data['total_in'], 0, ',', '.') }}</div>
            </td>
            <td style="width: 25%;">
                <div class="summary-label">Total Keluar (Kredit)</div>
                <div class="summary-value text-danger">-Rp {{ number_format($data['total_out'], 0, ',', '.') }}</div>
            </td>
            <td style="width: 25%;">
                <div class="summary-label">Saldo Akhir</div>
                <div class="summary-value text-primary">Rp {{ number_format($data['closing_balance'], 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <!-- Ledger Table (Natural, Clear, No Artificial Code) -->
    <table class="ledger-table">
        <thead>
            <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 9%;">Tanggal</th>
                <th style="width: 14%;">No. Bukti</th>
                <th style="width: 14%;">Pos / Kategori</th>
                <th style="width: 27%;">Uraian / Keterangan</th>
                <th style="width: 10.5%;" class="text-right">Debet / Masuk</th>
                <th style="width: 10.5%;" class="text-right">Kredit / Keluar</th>
                <th style="width: 11%;" class="text-right">Saldo Kas</th>
            </tr>
        </thead>
        <tbody>
            <!-- Saldo Awal Row -->
            <tr style="background-color: #f9fafb; font-weight: bold;">
                <td class="text-center">&bull;</td>
                <td>{{ \Carbon\Carbon::parse($data['period']['start_date'])->format('d/m/Y') }}</td>
                <td class="text-center text-muted">-</td>
                <td><em>Saldo Awal</em></td>
                <td>Saldo kas awal periode per {{ \Carbon\Carbon::parse($data['period']['start_date'])->format('d/m/Y') }}</td>
                <td class="text-right text-muted">-</td>
                <td class="text-right text-muted">-</td>
                <td class="text-right">{{ number_format($data['opening_balance'], 0, ',', '.') }}</td>
            </tr>

            <!-- Transactions Rows -->
            @forelse($data['transactions'] as $idx => $tx)
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td class="text-center">{{ \Carbon\Carbon::parse($tx['date'])->format('d/m/Y') }}</td>
                    <td>
                        <strong>{{ $tx['voucher_no'] ?: '-' }}</strong>
                    </td>
                    <td>{{ $tx['category'] ?: '-' }}</td>
                    <td>
                        {{ $tx['description'] }}
                        @if(!empty($tx['payee']) && $tx['payee'] !== '-')
                            <div style="font-size: 7pt; color: #4b5563;">
                                Pihak: {{ $tx['payee'] }}
                            </div>
                        @endif
                    </td>
                    <td class="text-right {{ $tx['amount_in'] > 0 ? 'text-success fw-bold' : '' }}">
                        {{ $tx['amount_in'] > 0 ? number_format($tx['amount_in'], 0, ',', '.') : '-' }}
                    </td>
                    <td class="text-right {{ $tx['amount_out'] > 0 ? 'text-danger fw-bold' : '' }}">
                        {{ $tx['amount_out'] > 0 ? number_format($tx['amount_out'], 0, ',', '.') : '-' }}
                    </td>
                    <td class="text-right fw-bold">
                        {{ number_format($tx['running_balance'], 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center text-muted" style="padding: 12px;">
                        Tidak ada transaksi mutasi kas pada rentang tanggal ini.
                    </td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="5" class="text-right" style="padding-right: 8px;">TOTAL PERIODE INI:</td>
                <td class="text-right text-success" style="font-size: 8.5pt;">
                    Rp {{ number_format($data['total_in'], 0, ',', '.') }}
                </td>
                <td class="text-right text-danger" style="font-size: 8.5pt;">
                    Rp {{ number_format($data['total_out'], 0, ',', '.') }}
                </td>
                <td class="text-right text-primary" style="font-size: 8.5pt;">
                    Rp {{ number_format($data['closing_balance'], 0, ',', '.') }}
                </td>
            </tr>
        </tfoot>
    </table>

    <!-- Signature Boxes (3 Pihak Standar Laporan Kas) -->
    <table class="signatures-table">
        <tr>
            <td class="role-title">Dibuat Oleh (Pemegang Kas / Kasir)</td>
            <td class="role-title">Diperiksa Oleh (Internal Auditor)</td>
            <td class="role-title">Disetujui Oleh (Pimpinan / Finance)</td>
        </tr>
        <tr>
            <td class="sign-space"></td>
            <td class="sign-space"></td>
            <td class="sign-space"></td>
        </tr>
        <tr>
            <td class="name-space">( Pengelola Kas Kecil )</td>
            <td class="name-space">( Verifikator / Akuntan )</td>
            <td class="name-space">( Manajer Keuangan )</td>
        </tr>
    </table>

    <div style="font-size: 7pt; color: #6b7280; text-align: right; margin-top: 6px;">
        Dicetak pada: {{ \Carbon\Carbon::now()->locale('id')->isoFormat('D MMMM Y, HH:mm') }} WIB &bull; Castra Financial System
    </div>

    <!-- Bagian 2: Lembar Lampiran Bukti Fisik Terindeks (Dual Card Layout per Page) -->
    @if(!empty($with_receipts) && !empty($receipts) && count($receipts) > 0)
        @foreach(array_chunk($receipts, 2) as $pageIdx => $pair)
            <div style="page-break-before: always;">
                <div class="appendix-header">
                    <table style="width: 100%;">
                        <tr>
                            <td style="vertical-align: middle;">
                                <h3 style="margin: 0; font-size: 11pt; text-transform: uppercase;">LAMPIRAN BUKTI TRANSAKSI FISIK &amp; NOTA ASLI</h3>
                                <div style="font-size: 7.5pt; color: #4b5563; margin-top: 1px;">
                                    Dokumentasi Sah Sesuai No. Bukti Transaksi &bull; Akun: <strong>{{ $data['account']['name'] }}</strong> &bull; Total Terlampir: <strong>{{ count($receipts) }} Berkas Nota</strong> (Lembar {{ $pageIdx + 1 }})
                                </div>
                            </td>
                            <td style="text-align: right; vertical-align: middle; font-size: 7.5pt; color: #6b7280;">
                                Urut sesuai tabel mutasi kas
                            </td>
                        </tr>
                    </table>
                </div>

                <table class="docket-pair-table">
                    <tr>
                        @foreach($pair as $r)
                            <td class="docket-cell">
                                <div class="docket-card">
                                    <!-- Header Kartu Bukti (Natural: No. Bukti Langsung) -->
                                    <div class="docket-header">
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="width: 65%; vertical-align: top; padding: 0;">
                                                    <div class="docket-voucher-no">{{ $r['voucher_no'] }}</div>
                                                    <div class="docket-submeta">
                                                        {{ \Carbon\Carbon::parse($r['date'])->locale('id')->isoFormat('D MMMM Y') }} &bull; {{ $r['category'] }}
                                                    </div>
                                                </td>
                                                <td style="width: 35%; text-align: right; vertical-align: top; padding: 0;">
                                                    <div class="docket-amount {{ $r['type'] === 'Masuk' ? 'text-success' : 'text-danger' }}">
                                                        {{ $r['type'] === 'Masuk' ? '+' : '-' }}Rp {{ number_format($r['amount'], 0, ',', '.') }}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        <div class="docket-desc">
                                            <strong>Keterangan:</strong> {{ $r['description'] }}
                                            @if(!empty($r['payee']) && $r['payee'] !== '-')
                                                &bull; <em>Pihak: {{ $r['payee'] }}</em>
                                            @endif
                                        </div>
                                    </div>

                                    <!-- Frame Gambar Nota Fisik (Proporsional & Tajam) -->
                                    <div class="docket-img-container">
                                        @if($r['is_image'] && !empty($r['base64']))
                                            <img src="{{ $r['base64'] }}" class="docket-img" alt="Nota {{ $r['voucher_no'] }}" />
                                        @elseif($r['is_pdf'])
                                            <div class="docket-pdf-box">
                                                <div style="font-size: 18pt; color: #dc2626; margin-bottom: 4px;">[PDF]</div>
                                                <div style="font-weight: bold; font-size: 8.5pt;">Dokumen PDF Terlampir</div>
                                                <div style="font-size: 7.5pt; color: #4b5563; margin-top: 3px;">{{ $r['file_name'] }}</div>
                                                <div style="font-size: 7pt; color: #6b7280; margin-top: 6px;">Berkas arsip fisik tersimpan secara digital dalam sistem.</div>
                                            </div>
                                        @else
                                            <div class="docket-pdf-box">
                                                <div style="font-size: 8pt; color: #6b7280;">Berkas fisik tidak dapat dimuat atau telah diarsipkan.</div>
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            </td>
                        @endforeach
                        @if(count($pair) < 2)
                            <td class="docket-cell" style="border: none; background: transparent;"></td>
                        @endif
                    </tr>
                </table>
            </div>
        @endforeach
    @endif

</body>
</html>
