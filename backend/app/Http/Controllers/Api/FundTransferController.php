<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FundTransferResource;
use App\Models\FundTransfer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FundTransferController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $user->fundTransfers()->with(['fromAccount', 'toAccount']);

        if ($request->filled('start_date')) {
            $query->where('transfer_date', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('transfer_date', '<=', $request->input('end_date'));
        }

        if ($request->filled('account_id')) {
            $accId = $request->input('account_id');
            $query->where(function ($q) use ($accId) {
                $q->where('from_account_id', $accId)->orWhere('to_account_id', $accId);
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%")
                    ->orWhereHas('fromAccount', function ($fq) use ($search) {
                        $fq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('toAccount', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $transfers = $query->orderByDesc('transfer_date')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => [
                'data' => FundTransferResource::collection($transfers)->resolve(),
                'links' => [
                    'first' => $transfers->url(1),
                    'last' => $transfers->url($transfers->lastPage()),
                    'prev' => $transfers->previousPageUrl(),
                    'next' => $transfers->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $transfers->currentPage(),
                    'from' => $transfers->firstItem(),
                    'last_page' => $transfers->lastPage(),
                    'path' => $transfers->path(),
                    'per_page' => $transfers->perPage(),
                    'to' => $transfers->lastItem(),
                    'total' => $transfers->total(),
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
            'from_account_id' => [
                'required',
                'integer',
                Rule::exists('ms_accounts', 'id')->where('user_id', $user->id),
            ],
            'to_account_id' => [
                'required',
                'integer',
                'different:from_account_id',
                Rule::exists('ms_accounts', 'id')->where('user_id', $user->id),
            ],
            'transfer_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999999.99'],
            'reference_no' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
            'attachment_path' => ['nullable', 'string', 'max:255'],
            'attachment' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:25600'],
        ]);

        if ($request->hasFile('attachment')) {
            $validated['attachment_path'] = $request->file('attachment')->store('transfers', 'public');
        }
        unset($validated['attachment']);

        $transfer = $user->fundTransfers()->create($validated);
        $transfer->load(['fromAccount', 'toAccount']);

        // Recalculate balances of both accounts
        $transfer->fromAccount?->recalculateBalance();
        $transfer->toAccount?->recalculateBalance();

        return response()->json([
            'data' => (new FundTransferResource($transfer))->resolve(),
            'message' => 'Mutasi transfer kas berhasil dicatat',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, FundTransfer $transfer)
    {
        if ($transfer->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Mutasi transfer tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $transfer->load(['fromAccount', 'toAccount']);

        return response()->json([
            'data' => (new FundTransferResource($transfer))->resolve(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, FundTransfer $transfer)
    {
        if ($transfer->user_id !== $request->user()->id) {
            return response()->json([
                'data' => null,
                'message' => 'Mutasi transfer tidak ditemukan',
                'errors' => null,
            ], 404);
        }

        $fromAccount = $transfer->fromAccount;
        $toAccount = $transfer->toAccount;

        $transfer->delete();

        $fromAccount?->recalculateBalance();
        $toAccount?->recalculateBalance();

        return response()->json([
            'data' => null,
            'message' => 'Mutasi transfer kas berhasil dihapus',
            'errors' => null,
        ]);
    }
}
