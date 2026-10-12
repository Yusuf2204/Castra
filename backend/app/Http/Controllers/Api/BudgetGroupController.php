<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BudgetGroupResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Budget Groups (Kelompok Anggaran) CRUD, scoped per authenticated user.
 */
class BudgetGroupController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->budgetGroups()->orderBy('sort_order')->orderBy('id');

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $budgetGroups = $query->get();

        return response()->json([
            'data' => BudgetGroupResource::collection($budgetGroups)->resolve(),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('ms_budget_groups')->where('user_id', $userId),
            ],
            'name' => ['required', 'string', 'max:100'],
            'percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['is_system'] = false;
        $data['is_active'] = $data['is_active'] ?? true;

        $budgetGroup = $request->user()->budgetGroups()->create($data);

        return response()->json([
            'data' => new BudgetGroupResource($budgetGroup),
            'message' => 'Budget group created',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $budgetGroup = $request->user()->budgetGroups()->findOrFail($id);

        return response()->json([
            'data' => new BudgetGroupResource($budgetGroup),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, $id)
    {
        $budgetGroup = $request->user()->budgetGroups()->findOrFail($id);
        $userId = $request->user()->id;

        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('ms_budget_groups')->where('user_id', $userId)->ignore($budgetGroup->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $budgetGroup->update($data);

        return response()->json([
            'data' => new BudgetGroupResource($budgetGroup),
            'message' => 'Budget group updated',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $budgetGroup = $request->user()->budgetGroups()->findOrFail($id);

        if ($budgetGroup->is_system) {
            return response()->json([
                'data' => null,
                'message' => 'Kelompok anggaran sistem tidak dapat dihapus.',
                'errors' => ['budget_group' => ['Kelompok anggaran bawaan sistem dilindungi.']],
            ], 422);
        }

        if ($budgetGroup->categories()->exists()) {
            return response()->json([
                'data' => null,
                'message' => 'Kelompok anggaran tidak dapat dihapus karena masih digunakan oleh kategori.',
                'errors' => ['budget_group' => ['Terdapat kategori yang terhubung ke kelompok anggaran ini.']],
            ], 422);
        }

        $budgetGroup->delete();

        return response()->json([
            'data' => null,
            'message' => 'Budget group deleted',
            'errors' => null,
        ]);
    }
}
