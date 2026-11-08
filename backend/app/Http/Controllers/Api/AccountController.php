<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $user->accounts();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->boolean('all')) {
            $accounts = $query->orderBy('name')->get();
            $totalBalance = (float) $accounts->sum('current_balance');
            $pettyCashBalance = (float) $accounts->where('type', 'petty_cash')->sum('current_balance');

            return response()->json([
                'data' => AccountResource::collection($accounts)->resolve(),
                'summary' => [
                    'total_balance' => $totalBalance,
                    'petty_cash_balance' => $pettyCashBalance,
                ],
                'message' => 'OK',
                'errors' => null,
            ]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $accounts = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'data' => [
                'data' => AccountResource::collection($accounts)->resolve(),
                'links' => [
                    'first' => $accounts->url(1),
                    'last' => $accounts->url($accounts->lastPage()),
                    'prev' => $accounts->previousPageUrl(),
                    'next' => $accounts->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $accounts->currentPage(),
                    'from' => $accounts->firstItem(),
                    'last_page' => $accounts->lastPage(),
                    'path' => $accounts->path(),
                    'per_page' => $accounts->perPage(),
                    'to' => $accounts->lastItem(),
                    'total' => $accounts->total(),
                ],
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ms_accounts', 'name')->where('user_id', $user->id),
            ],
            'type' => ['required', 'string', 'in:petty_cash,cash,bank,e_wallet,other'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'currency' => ['nullable', 'string', 'max:10'],
            'initial_balance' => ['nullable', 'numeric', 'min:0'],
            'imprest_limit' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $initialBalance = (float) ($validated['initial_balance'] ?? 0.0);
        $validated['initial_balance'] = $initialBalance;
        $validated['current_balance'] = $initialBalance;
        $validated['currency'] = $validated['currency'] ?? 'IDR';
        $validated['is_active'] = $validated['is_active'] ?? true;

        $account = $user->accounts()->create($validated);

        return response()->json([
            'data' => (new AccountResource($account))->resolve(),
            'message' => 'Akun kas/bank berhasil ditambahkan',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Akun tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $account->recalculateBalance();

        return response()->json([
            'data' => (new AccountResource($account))->resolve(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, Account $account)
    {
        $user = $request->user();

        if ($account->user_id !== $user->id) {
            return response()->json([
                'data' => null,
                'message' => 'Akun tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('ms_accounts', 'name')->ignore($account->id)->where('user_id', $user->id),
            ],
            'type' => ['sometimes', 'required', 'string', 'in:petty_cash,cash,bank,e_wallet,other'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'currency' => ['nullable', 'string', 'max:10'],
            'initial_balance' => ['sometimes', 'numeric', 'min:0'],
            'imprest_limit' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $account->update($validated);
        $account->recalculateBalance();

        return response()->json([
            'data' => (new AccountResource($account))->resolve(),
            'message' => 'Akun kas/bank berhasil diperbarui',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Akun tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $hasTransactions = $account->inTransactions()->exists()
            || $account->outTransactions()->exists()
            || $account->transfersIn()->exists()
            || $account->transfersOut()->exists();

        if ($hasTransactions) {
            return response()->json([
                'data' => null,
                'message' => 'Akun tidak dapat dihapus karena telah memiliki riwayat mutasi/transaksi.',
                'errors' => ['account' => ['Akun telah memiliki mutasi transaksi.']],
            ], 422);
        }

        $account->delete();

        return response()->json([
            'data' => null,
            'message' => 'Akun kas/bank berhasil dihapus',
            'errors' => null,
        ]);
    }
}
