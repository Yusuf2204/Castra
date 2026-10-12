<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IncomeTransactionResource;
use App\Models\IncomeTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Income Transactions CRUD & Calendar endpoints, scoped per authenticated user.
 */
class IncomeController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->incomeTransactions()->with(['incomeSource', 'category']);

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
            'income_source_id' => ['nullable', 'integer'],
        ]);

        $monthDate = Carbon::createFromFormat('Y-m', $validated['month']);

        $query = $request->user()->incomeTransactions()
            ->with(['incomeSource', 'category'])
            ->whereYear('transaction_date', $monthDate->year)
            ->whereMonth('transaction_date', $monthDate->month);

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
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $income = $user->incomeTransactions()->create($validated);
        $income->load(['incomeSource', 'category']);

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

        $income->load(['incomeSource', 'category']);

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
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $income->update($validated);
        $income->load(['incomeSource', 'category']);

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

        $income->delete();

        return response()->json([
            'data' => null,
            'message' => 'Transaksi pemasukan berhasil dihapus',
            'errors' => null,
        ]);
    }
}
