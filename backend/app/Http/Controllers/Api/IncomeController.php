<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IncomeTransactionResource;
use App\Models\Account;
use App\Models\IncomeTransaction;
use App\Services\ReceiptOcrService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Income Transactions CRUD & Calendar endpoints, scoped per authenticated user.
 */
class IncomeController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->incomeTransactions()->with(['incomeSource', 'category', 'account']);

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

        if ($request->filled('income_source_id')) {
            $query->where('income_source_id', $request->input('income_source_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                    ->orWhere('voucher_no', 'like', "%{$search}%")
                    ->orWhereHas('incomeSource', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $incomes = $query->orderByDesc('transaction_date')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => [
                'data' => IncomeTransactionResource::collection($incomes)->resolve(),
                'links' => [
                    'first' => $incomes->url(1),
                    'last' => $incomes->url($incomes->lastPage()),
                    'prev' => $incomes->previousPageUrl(),
                    'next' => $incomes->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $incomes->currentPage(),
                    'from' => $incomes->firstItem(),
                    'last_page' => $incomes->lastPage(),
                    'path' => $incomes->path(),
                    'per_page' => $incomes->perPage(),
                    'to' => $incomes->lastItem(),
                    'total' => $incomes->total(),
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
            'income_source_id' => ['nullable', 'integer'],
        ]);

        $monthDate = Carbon::createFromFormat('Y-m', $validated['month']);

        $query = $request->user()->incomeTransactions()
            ->with(['incomeSource', 'category', 'account'])
            ->whereYear('transaction_date', $monthDate->year)
            ->whereMonth('transaction_date', $monthDate->month);

        if (! empty($validated['account_id'])) {
            $query->where('account_id', $validated['account_id']);
        }

        if (! empty($validated['income_source_id'])) {
            $query->where('income_source_id', $validated['income_source_id']);
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
            $days[$dateKey]['items'][] = (new IncomeTransactionResource($tx))->resolve();
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
            'income_source_id' => [
                'required',
                'integer',
                Rule::exists('ms_income_sources', 'id')->where('user_id', $user->id),
            ],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('ms_categories', 'id')->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)->where('type', 'income');
                }),
            ],
            'transaction_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999999.99'],
            'voucher_no' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
            'attachment_path' => ['nullable', 'string', 'max:255'],
            'attachment' => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
        ]);

        if (empty($validated['account_id'])) {
            $defaultAcc = $user->accounts()->where('type', 'petty_cash')->where('is_active', true)->first()
                ?? $user->accounts()->where('is_active', true)->first();
            if ($defaultAcc) {
                $validated['account_id'] = $defaultAcc->id;
            }
        }

        if ($request->hasFile('attachment')) {
            $validated['attachment_path'] = $request->file('attachment')->store('receipts', 'public');
        }
        unset($validated['attachment']);

        if (empty($validated['voucher_no'])) {
            $ym = Carbon::parse($validated['transaction_date'])->format('Ym');
            $count = $user->incomeTransactions()
                ->where('transaction_date', 'like', Carbon::parse($validated['transaction_date'])->format('Y-m').'%')
                ->count() + 1;
            $validated['voucher_no'] = sprintf('BKM-%s-%04d', $ym, $count);
        }

        $income = $user->incomeTransactions()->create($validated);
        $income->load(['incomeSource', 'category', 'account']);
        $income->account?->recalculateBalance();

        return response()->json([
            'data' => (new IncomeTransactionResource($income))->resolve(),
            'message' => 'Transaksi pemasukan berhasil dicatat',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, IncomeTransaction $income)
    {
        if ($income->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $income->load(['incomeSource', 'category', 'account']);

        return response()->json([
            'data' => (new IncomeTransactionResource($income))->resolve(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, IncomeTransaction $income)
    {
        $user = $request->user();

        if ($income->user_id !== $user->id) {
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
            'income_source_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('ms_income_sources', 'id')->where('user_id', $user->id),
            ],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('ms_categories', 'id')->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)->where('type', 'income');
                }),
            ],
            'transaction_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:9999999999999.99'],
            'voucher_no' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
            'attachment_path' => ['nullable', 'string', 'max:255'],
            'attachment' => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
        ]);

        if ($request->hasFile('attachment')) {
            $validated['attachment_path'] = $request->file('attachment')->store('receipts', 'public');
        }
        unset($validated['attachment']);

        $oldAccountId = $income->account_id;
        $income->update($validated);
        $income->load(['incomeSource', 'category', 'account']);

        if ($oldAccountId && $oldAccountId !== $income->account_id) {
            Account::find($oldAccountId)?->recalculateBalance();
        }
        $income->account?->recalculateBalance();

        return response()->json([
            'data' => (new IncomeTransactionResource($income))->resolve(),
            'message' => 'Transaksi pemasukan berhasil diperbarui',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, IncomeTransaction $income)
    {
        if ($income->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Transaksi tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $account = $income->account;
        $income->delete();
        $account?->recalculateBalance();

        return response()->json([
            'data' => null,
            'message' => 'Transaksi pemasukan berhasil dihapus',
            'errors' => null,
        ]);
    }

    /**
     * Scan an uploaded proof of income / receipt using Tesseract OCR.
     */
    public function scanReceipt(Request $request, ReceiptOcrService $ocrService)
    {
        $request->validate([
            'receipt' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,webp', 'max:10240'],
        ]);

        $file = $request->file('receipt');
        $parsed = $ocrService->scanIncome($file, $request->user());

        $storedPath = $file->store('receipts', 'public');
        $parsed['attachment_path'] = $storedPath;
        $parsed['attachment_url'] = Storage::disk('public')->url($storedPath);

        return response()->json([
            'data' => $parsed,
            'message' => 'Bukti pemasukan berhasil dipindai',
            'errors' => null,
        ]);
    }
}
