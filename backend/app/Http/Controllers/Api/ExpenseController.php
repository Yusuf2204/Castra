<?php

namespace App\Http\Controllers\Api;

use App\Helpers\TerbilangHelper;
use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseTransactionResource;
use App\Models\Account;
use App\Models\ExpenseTransaction;
use App\Services\ReceiptOcrService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Expense Transactions CRUD & Calendar endpoints, scoped per authenticated user.
 */
class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->expenseTransactions()
            ->whereNull('parent_id')
            ->with(['category.budgetGroup', 'account', 'approver', 'children.category.budgetGroup']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('month')) {
            try {
                $monthDate = Carbon::createFromFormat('Y-m', $request->input('month'));
                $query->whereYear('transaction_date', $monthDate->year)
                    ->whereMonth('transaction_date', $monthDate->month);
            } catch (\Exception) {
                // Ignore invalid month format
            }
        }

        if ($request->filled('start_date')) {
            $query->where('transaction_date', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('transaction_date', '<=', $request->input('end_date'));
        }

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->input('account_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('budget_group_id')) {
            $bgId = $request->input('budget_group_id');
            $query->whereHas('category', function ($q) use ($bgId) {
                $q->where('budget_group_id', $bgId);
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                    ->orWhere('payee', 'like', "%{$search}%")
                    ->orWhere('voucher_no', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $expenses = $query->orderByDesc('transaction_date')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => [
                'data' => ExpenseTransactionResource::collection($expenses)->resolve(),
                'links' => [
                    'first' => $expenses->url(1),
                    'last' => $expenses->url($expenses->lastPage()),
                    'prev' => $expenses->previousPageUrl(),
                    'next' => $expenses->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $expenses->currentPage(),
                    'from' => $expenses->firstItem(),
                    'last_page' => $expenses->lastPage(),
                    'path' => $expenses->path(),
                    'per_page' => $expenses->perPage(),
                    'to' => $expenses->lastItem(),
                    'total' => $expenses->total(),
                ],
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function calendar(Request $request)
    {
        $validated = $request->validate([
            'month' => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'account_id' => ['nullable', 'integer'],
            'category_id' => ['nullable', 'integer'],
            'budget_group_id' => ['nullable', 'integer'],
        ]);

        $monthDate = Carbon::createFromFormat('Y-m', $validated['month']);

        $query = $request->user()->expenseTransactions()
            ->with(['category.budgetGroup', 'account'])
            ->whereYear('transaction_date', $monthDate->year)
            ->whereMonth('transaction_date', $monthDate->month);

        if (! empty($validated['account_id'])) {
            $query->where('account_id', $validated['account_id']);
        }

        if (! empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        if (! empty($validated['budget_group_id'])) {
            $bgId = $validated['budget_group_id'];
            $query->whereHas('category', function ($q) use ($bgId) {
                $q->where('budget_group_id', $bgId);
            });
        }

        $transactions = $query->orderBy('transaction_date')->orderBy('id')->get();

        $days = [];
        $totalMonth = 0.0;

        foreach ($transactions as $tx) {
            $dateKey = $tx->transaction_date instanceof \DateTimeInterface
                ? $tx->transaction_date->format('Y-m-d')
                : (string) $tx->transaction_date;

            $amount = (float) $tx->amount;
            $totalMonth += $amount;

            if (! isset($days[$dateKey])) {
                $days[$dateKey] = [
                    'date' => $dateKey,
                    'total' => 0.0,
                    'count' => 0,
                    'items' => [],
                ];
            }

            $days[$dateKey]['total'] += $amount;
            $days[$dateKey]['count'] += 1;
            $days[$dateKey]['items'][] = (new ExpenseTransactionResource($tx))->resolve();
        }

        return response()->json([
            'data' => [
                'month' => $validated['month'],
                'total_month' => $totalMonth,
                'transaction_count' => $transactions->count(),
                'days' => (object) $days,
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'account_id' => [
                'nullable',
                'integer',
                Rule::exists('ms_accounts', 'id')->where('user_id', $user->id),
            ],
            'category_id' => [
                'required',
                'integer',
                Rule::exists('ms_categories', 'id')->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)->where('type', 'expense');
                }),
            ],
            'transaction_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999999.99'],
            'currency' => ['nullable', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.000001'],
            'voucher_no' => ['nullable', 'string', 'max:50'],
            'payee' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'string', 'in:draft,submitted,approved,rejected'],
            'attachment_path' => ['nullable', 'string', 'max:255'],
            'attachment' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:25600'],
            'splits' => ['nullable', 'array', 'min:1'],
            'splits.*.category_id' => [
                'required_with:splits',
                'integer',
                Rule::exists('ms_categories', 'id')->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)->where('type', 'expense');
                }),
            ],
            'splits.*.amount' => ['required_with:splits', 'numeric', 'min:0.01'],
            'splits.*.notes' => ['nullable', 'string', 'max:500'],
        ]);

        $splits = $validated['splits'] ?? null;
        unset($validated['splits']);

        if (empty($validated['account_id'])) {
            $defaultAcc = $user->accounts()->where('type', 'petty_cash')->where('is_active', true)->first()
                ?? $user->accounts()->where('is_active', true)->first();
            if ($defaultAcc) {
                $validated['account_id'] = $defaultAcc->id;
            }
        }

        $account = ! empty($validated['account_id']) ? Account::find($validated['account_id']) : null;
        if (empty($validated['currency'])) {
            $validated['currency'] = $account?->currency ?? 'IDR';
        }
        if (empty($validated['exchange_rate'])) {
            $validated['exchange_rate'] = 1.0;
        }
        if (empty($validated['status'])) {
            $validated['status'] = 'approved';
        }

        if ($request->hasFile('attachment')) {
            $validated['attachment_path'] = $request->file('attachment')->store('receipts', 'public');
        }
        unset($validated['attachment']);

        if (empty($validated['voucher_no'])) {
            $ym = Carbon::parse($validated['transaction_date'])->format('Ym');
            $count = $user->expenseTransactions()
                ->where('transaction_date', 'like', Carbon::parse($validated['transaction_date'])->format('Y-m').'%')
                ->count() + 1;
            $validated['voucher_no'] = sprintf('BKK-%s-%04d', $ym, $count);
        }

        if ($validated['status'] === 'approved') {
            $validated['approved_by'] = $user->id;
            $validated['approved_at'] = Carbon::now();
        }

        $expense = $user->expenseTransactions()->create($validated);

        // Process Category Splits if provided (> 1 item)
        if (! empty($splits) && count($splits) > 1) {
            foreach ($splits as $splitItem) {
                $user->expenseTransactions()->create([
                    'parent_id' => $expense->id,
                    'account_id' => $expense->account_id,
                    'category_id' => $splitItem['category_id'],
                    'transaction_date' => $expense->transaction_date,
                    'amount' => (float) $splitItem['amount'],
                    'currency' => $expense->currency ?? 'IDR',
                    'exchange_rate' => $expense->exchange_rate ?? 1.0,
                    'voucher_no' => $expense->voucher_no,
                    'payee' => $expense->payee,
                    'notes' => $splitItem['notes'] ?? $expense->notes,
                    'status' => $expense->status,
                    'approved_by' => $expense->approved_by,
                    'approved_at' => $expense->approved_at,
                    'attachment_path' => $expense->attachment_path,
                ]);
            }
        }

        $expense->load(['category.budgetGroup', 'account', 'approver', 'children.category.budgetGroup']);
        $expense->account?->recalculateBalance();

        return response()->json([
            'data' => (new ExpenseTransactionResource($expense))->resolve(),
            'message' => 'Transaksi pengeluaran berhasil dicatat',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, ExpenseTransaction $expense)
    {
        if ($expense->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $expense->load(['category.budgetGroup', 'account']);

        return response()->json([
            'data' => (new ExpenseTransactionResource($expense))->resolve(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, ExpenseTransaction $expense)
    {
        $user = $request->user();

        if ($expense->user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $validated = $request->validate([
            'account_id' => [
                'nullable',
                'integer',
                Rule::exists('ms_accounts', 'id')->where('user_id', $user->id),
            ],
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('ms_categories', 'id')->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)->where('type', 'expense');
                }),
            ],
            'transaction_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:9999999999999.99'],
            'voucher_no' => ['nullable', 'string', 'max:50'],
            'payee' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:500'],
            'attachment_path' => ['nullable', 'string', 'max:255'],
            'attachment' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:25600'],
        ]);

        if ($request->hasFile('attachment')) {
            $validated['attachment_path'] = $request->file('attachment')->store('receipts', 'public');
        }
        unset($validated['attachment']);

        $oldAccountId = $expense->account_id;
        $expense->update($validated);
        $expense->load(['category.budgetGroup', 'account']);

        if ($oldAccountId && $oldAccountId !== $expense->account_id) {
            Account::find($oldAccountId)?->recalculateBalance();
        }
        $expense->account?->recalculateBalance();

        return response()->json([
            'data' => (new ExpenseTransactionResource($expense))->resolve(),
            'message' => 'Transaksi pengeluaran berhasil diperbarui',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, ExpenseTransaction $expense)
    {
        if ($expense->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $account = $expense->account;
        $expense->delete();
        $account?->recalculateBalance();

        return response()->json([
            'data' => null,
            'message' => 'Transaksi pengeluaran berhasil dihapus',
            'errors' => null,
        ]);
    }

    /**
     * Approve an expense voucher (Approver action).
     */
    public function approve(Request $request, ExpenseTransaction $expense)
    {
        $user = $request->user();

        if ($expense->user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $expense->status = 'approved';
        $expense->approved_by = $user->id;
        $expense->approved_at = Carbon::now();
        $expense->save();

        // Also update child split transactions if any
        $expense->children()->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => Carbon::now(),
        ]);

        $expense->account?->recalculateBalance();
        $expense->load(['category.budgetGroup', 'account', 'approver', 'children.category.budgetGroup']);

        return response()->json([
            'data' => (new ExpenseTransactionResource($expense))->resolve(),
            'message' => 'Voucher pengeluaran berhasil disetujui (Approved)',
            'errors' => null,
        ]);
    }

    /**
     * Reject an expense voucher.
     */
    public function reject(Request $request, ExpenseTransaction $expense)
    {
        $user = $request->user();

        if ($expense->user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $expense->status = 'rejected';
        $expense->save();

        $expense->children()->update([
            'status' => 'rejected',
        ]);

        $expense->account?->recalculateBalance();
        $expense->load(['category.budgetGroup', 'account', 'approver', 'children.category.budgetGroup']);

        return response()->json([
            'data' => (new ExpenseTransactionResource($expense))->resolve(),
            'message' => 'Voucher pengeluaran ditolak (Rejected)',
            'errors' => null,
        ]);
    }

    /**
     * Submit an expense voucher for approval (Maker action).
     */
    public function submit(Request $request, ExpenseTransaction $expense)
    {
        $user = $request->user();

        if ($expense->user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $expense->status = 'submitted';
        $expense->save();

        $expense->children()->update([
            'status' => 'submitted',
        ]);

        $expense->account?->recalculateBalance();
        $expense->load(['category.budgetGroup', 'account', 'approver', 'children.category.budgetGroup']);

        return response()->json([
            'data' => (new ExpenseTransactionResource($expense))->resolve(),
            'message' => 'Voucher berhasil diajukan untuk persetujuan (Submitted)',
            'errors' => null,
        ]);
    }

    /**
     * Scan and parse receipt image via OCR.
     */
    public function scanReceipt(Request $request, ReceiptOcrService $ocrService)
    {
        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:25600'],
        ]);

        $file = $request->file('receipt');
        $isPdf = $file->getClientMimeType() === 'application/pdf' || strtolower($file->getClientOriginalExtension()) === 'pdf';

        if ($isPdf) {
            $storedPath = $file->store('receipts', 'public');
            return response()->json([
                'data' => [
                    'attachment_path' => $storedPath,
                    'attachment_url' => '/storage/' . ltrim($storedPath, '/'),
                    'file_name' => $file->getClientOriginalName(),
                ],
                'message' => 'Dokumen PDF berhasil dilampirkan',
                'errors' => null,
            ]);
        }

        try {
            $parsed = $ocrService->scan($file, $request->user());
        } catch (\Throwable $e) {
            $parsed = [];
        }

        $storedPath = $file->store('receipts', 'public');
        $parsed['attachment_path'] = $storedPath;
        $parsed['attachment_url'] = '/storage/' . ltrim($storedPath, '/');
        $parsed['payee'] = $parsed['merchant'] ?? null;

        return response()->json([
            'data' => $parsed,
            'message' => 'Nota berhasil dipindai',
            'errors' => null,
        ]);
    }

    /**
     * Direct upload receipt/invoice file (image or PDF) without OCR.
     */
    public function uploadReceipt(Request $request)
    {
        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:25600'],
        ]);

        $file = $request->file('receipt');
        $storedPath = $file->store('receipts', 'public');

        return response()->json([
            'data' => [
                'attachment_path' => $storedPath,
                'attachment_url' => '/storage/' . ltrim($storedPath, '/'),
                'file_name' => $file->getClientOriginalName(),
            ],
            'message' => 'Bukti transaksi berhasil diunggah',
            'errors' => null,
        ]);
    }

    /**
     * Generate official BKK PDF voucher.
     */
    public function exportPdf(Request $request, ExpenseTransaction $expense)
    {
        $user = $request->user();

        if ($expense->user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $expense->load(['category.budgetGroup', 'account', 'user', 'approver', 'children.category.budgetGroup']);

        $terbilang = TerbilangHelper::make($expense->amount);

        $receiptBase64 = null;
        $includeReceipt = $request->boolean('include_receipt', true);

        if ($includeReceipt && $expense->attachment_path) {
            $path = $expense->attachment_path;
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
                if (Storage::disk('public')->exists($path)) {
                    $mime = Storage::disk('public')->mimeType($path) ?? 'image/jpeg';
                    $raw = Storage::disk('public')->get($path);
                    $receiptBase64 = 'data:' . $mime . ';base64,' . base64_encode($raw);
                }
            }
        }

        $pdf = Pdf::loadView('pdf.voucher_bkk', [
            'transaction' => $expense,
            'terbilang' => $terbilang,
            'receiptBase64' => $receiptBase64,
        ])->setPaper('a4', 'portrait');

        $cleanNo = preg_replace('/[^A-Za-z0-9_\-]/', '_', $expense->voucher_no ?: 'BKK_' . $expense->id);
        $fileName = 'Voucher_' . $cleanNo . '.pdf';

        if ($request->boolean('download')) {
            return $pdf->download($fileName);
        }

        return $pdf->stream($fileName);
    }
}
