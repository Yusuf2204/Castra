<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BudgetPeriodResource;
use App\Http\Resources\CategoryBudgetAllocationResource;
use App\Models\BudgetPeriod;
use App\Models\CategoryBudgetAllocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetPeriodController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->budgetPeriods()
            ->with(['allocations.category.budgetGroup'])
            ->orderBy('start_date', 'desc');

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $periods = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => BudgetPeriodResource::collection($periods)->resolve(),
            'meta' => [
                'current_page' => $periods->currentPage(),
                'last_page' => $periods->lastPage(),
                'per_page' => $periods->perPage(),
                'total' => $periods->total(),
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'income_transaction_id' => [
                'nullable',
                'integer',
                'exists:in_transactions,id,user_id,'.$user->id,
            ],
            'total_income_allocated' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
            'copy_from_period_id' => [
                'nullable',
                'integer',
                'exists:ms_budget_periods,id,user_id,'.$user->id,
            ],
            'auto_generate_allocations' => ['nullable', 'boolean'],
        ]);

        $periodData = [
            'name' => $data['name'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'income_transaction_id' => $data['income_transaction_id'] ?? null,
            'total_income_allocated' => $data['total_income_allocated'] ?? 0.00,
            'is_active' => $data['is_active'] ?? true,
            'notes' => $data['notes'] ?? null,
        ];

        return DB::transaction(function () use ($user, $periodData, $data) {
            // If new period is marked as active, optionally set older periods inactive
            if (! empty($periodData['is_active'])) {
                $user->budgetPeriods()->where('is_active', true)->update(['is_active' => false]);
            }

            $period = $user->budgetPeriods()->create($periodData);

            // Populate allocations
            $expenseCategories = $user->categories()
                ->where('type', 'expense')
                ->where('is_active', true)
                ->with('budgetGroup')
                ->get();

            if (! empty($data['copy_from_period_id'])) {
                // Copy from chosen period
                $sourceAllocations = CategoryBudgetAllocation::where('budget_period_id', $data['copy_from_period_id'])
                    ->where('user_id', $user->id)
                    ->get()
                    ->keyBy('category_id');

                foreach ($expenseCategories as $cat) {
                    $amount = isset($sourceAllocations[$cat->id])
                        ? (float) $sourceAllocations[$cat->id]->allocated_amount
                        : (float) $cat->monthly_estimate;

                    $period->allocations()->create([
                        'user_id' => $user->id,
                        'category_id' => $cat->id,
                        'allocated_amount' => $amount,
                    ]);
                }
            } else {
                // Auto generate based on baseline estimate or envelope groups
                foreach ($expenseCategories as $cat) {
                    $amount = (float) $cat->monthly_estimate;
                    $period->allocations()->create([
                        'user_id' => $user->id,
                        'category_id' => $cat->id,
                        'allocated_amount' => $amount,
                    ]);
                }
            }

            $period->load(['allocations.category.budgetGroup']);

            return response()->json([
                'data' => new BudgetPeriodResource($period),
                'message' => 'Periode anggaran berhasil dibuat',
                'errors' => null,
            ], 201);
        });
    }

    public function show(Request $request, BudgetPeriod $budgetPeriod)
    {
        if ($budgetPeriod->user_id !== $request->user()->id) {
            abort(404);
        }

        $budgetPeriod->load(['allocations.category.budgetGroup']);

        return response()->json([
            'data' => new BudgetPeriodResource($budgetPeriod),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, BudgetPeriod $budgetPeriod)
    {
        if ($budgetPeriod->user_id !== $request->user()->id) {
            abort(404);
        }

        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
            'income_transaction_id' => [
                'nullable',
                'integer',
                'exists:in_transactions,id,user_id,'.$user->id,
            ],
            'total_income_allocated' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        if (isset($data['is_active']) && $data['is_active']) {
            $user->budgetPeriods()
                ->where('id', '!=', $budgetPeriod->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $budgetPeriod->update($data);
        $budgetPeriod->load(['allocations.category.budgetGroup']);

        return response()->json([
            'data' => new BudgetPeriodResource($budgetPeriod),
            'message' => 'Periode anggaran berhasil diperbarui',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, BudgetPeriod $budgetPeriod)
    {
        if ($budgetPeriod->user_id !== $request->user()->id) {
            abort(404);
        }

        $budgetPeriod->delete();

        return response()->json([
            'data' => null,
            'message' => 'Periode anggaran berhasil dihapus',
            'errors' => null,
        ]);
    }

    public function getAllocations(Request $request, BudgetPeriod $budgetPeriod)
    {
        if ($budgetPeriod->user_id !== $request->user()->id) {
            abort(404);
        }

        $allocations = $budgetPeriod->allocations()
            ->with(['category.budgetGroup'])
            ->get();

        return response()->json([
            'data' => CategoryBudgetAllocationResource::collection($allocations)->resolve(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function updateAllocations(Request $request, BudgetPeriod $budgetPeriod)
    {
        if ($budgetPeriod->user_id !== $request->user()->id) {
            abort(404);
        }

        $user = $request->user();

        $data = $request->validate([
            'allocations' => ['required', 'array'],
            'allocations.*.category_id' => [
                'required',
                'integer',
                'exists:ms_categories,id,user_id,'.$user->id.',type,expense',
            ],
            'allocations.*.allocated_amount' => ['required', 'numeric', 'min:0'],
            'allocations.*.notes' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($user, $budgetPeriod, $data) {
            foreach ($data['allocations'] as $item) {
                CategoryBudgetAllocation::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'budget_period_id' => $budgetPeriod->id,
                        'category_id' => $item['category_id'],
                    ],
                    [
                        'allocated_amount' => $item['allocated_amount'],
                        'notes' => $item['notes'] ?? null,
                    ]
                );
            }
        });

        $budgetPeriod->load(['allocations.category.budgetGroup']);

        return response()->json([
            'data' => new BudgetPeriodResource($budgetPeriod),
            'message' => 'Alokasi anggaran kategori berhasil disimpan',
            'errors' => null,
        ]);
    }
}

