<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function cashFlow(Request $request)
    {
        $year = (int) $request->input('year', Carbon::now()->year);
        $user = $request->user();

        $data = $this->reportService->getCashFlow($user, $year);

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function budgetComparison(Request $request)
    {
        $monthStr = $request->input('month');
        $periodId = $request->filled('period_id') ? (int) $request->input('period_id') : null;
        $user = $request->user();

        // If neither is passed, default to current month or active period
        $data = $this->reportService->getBudgetComparison($user, $monthStr, $periodId);

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function categoryBreakdown(Request $request)
    {
        $monthStr = $request->input('month', Carbon::now()->format('Y-m'));
        $user = $request->user();

        $data = $this->reportService->getCategoryBreakdown($user, $monthStr);

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function accountStatement(Request $request)
    {
        $request->validate([
            'account_id' => 'required|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $user = $request->user();
        $accountId = (int) $request->input('account_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $data = $this->reportService->getAccountStatement($user, $accountId, $startDate, $endDate);

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function accountStatementPdf(Request $request)
    {
        $request->validate([
            'account_id' => 'required|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'with_receipts' => 'nullable|boolean',
            'download' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $accountId = (int) $request->input('account_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $withReceipts = $request->boolean('with_receipts', false);

        $data = $this->reportService->getAccountStatement($user, $accountId, $startDate, $endDate);

        $receipts = [];
        if ($withReceipts && !empty($data['transactions'])) {
            foreach ($data['transactions'] as $tx) {
                if (!empty($tx['attachment_path'])) {
                    $path = $tx['attachment_path'];
                    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                    $isImage = in_array($ext, ['jpg', 'jpeg', 'png', 'webp']);
                    $isPdf = ($ext === 'pdf');

                    $base64 = null;
                    if ($isImage && Storage::disk('public')->exists($path)) {
                        $mime = Storage::disk('public')->mimeType($path) ?? 'image/jpeg';
                        $raw = Storage::disk('public')->get($path);
                        $base64 = 'data:' . $mime . ';base64,' . base64_encode($raw);
                    }

                    $receipts[] = [
                        'voucher_no' => $tx['voucher_no'] ?: ($tx['type'] . ' #' . $tx['id']),
                        'date' => $tx['date'],
                        'description' => $tx['description'],
                        'category' => $tx['category'] ?? '-',
                        'payee' => $tx['payee'] ?? '-',
                        'amount' => $tx['amount_out'] > 0 ? $tx['amount_out'] : $tx['amount_in'],
                        'type' => $tx['type'],
                        'is_image' => $isImage,
                        'is_pdf' => $isPdf,
                        'file_name' => basename($path),
                        'base64' => $base64,
                    ];
                }
            }
        }

        $pdf = Pdf::loadView('pdf.petty_cash_book', [
            'data' => $data,
            'with_receipts' => $withReceipts,
            'receipts' => $receipts,
        ])->setPaper('a4', 'landscape');

        $cleanAccountName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $data['account']['name'] ?? 'Kas');
        $prefix = $withReceipts ? 'Bundel_Lengkap_Buku_Kas' : 'Rekap_Buku_Kas';
        $fileName = "{$prefix}_{$cleanAccountName}_{$data['period']['start_date']}_sd_{$data['period']['end_date']}.pdf";

        if ($request->boolean('download')) {
            return $pdf->download($fileName);
        }

        return $pdf->stream($fileName);
    }
}
