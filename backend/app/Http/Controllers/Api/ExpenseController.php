<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseTransactionResource;
use App\Models\ExpenseTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Expense Transactions CRUD & Calendar endpoints, scoped per authenticated user.
 */
class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->expenseTransactions()->with('category.budgetGroup');

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
            'category_id' => ['nullable', 'integer'],
            'budget_group_id' => ['nullable', 'integer'],
        ]);

        $monthDate = Carbon::createFromFormat('Y-m', $validated['month']);

        $query = $request->user()->expenseTransactions()
            ->with('category.budgetGroup')
            ->whereYear('transaction_date', $monthDate->year)
            ->whereMonth('transaction_date', $monthDate->month);

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
            'category_id' => [
                'required',
                'integer',
                Rule::exists('ms_categories', 'id')->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)->where('type', 'expense');
                }),
            ],
            'transaction_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $expense = $user->expenseTransactions()->create($validated);
        $expense->load('category.budgetGroup');

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

        $expense->load('category.budgetGroup');

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
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('ms_categories', 'id')->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)->where('type', 'expense');
                }),
            ],
            'transaction_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $expense->update($validated);
        $expense->load('category.budgetGroup');

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

        $expense->delete();

        return response()->json([
            'data' => null,
            'message' => 'Transaksi pengeluaran berhasil dihapus',
            'errors' => null,
        ]);
    }
}
