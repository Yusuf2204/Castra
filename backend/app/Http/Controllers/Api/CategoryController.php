<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Categories (Kategori) CRUD, scoped per authenticated user.
 */
class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->categories()->with('budgetGroup');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('budget_group_id')) {
            $query->where('budget_group_id', $request->input('budget_group_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        // Support returning all items for dropdown selections
        if ($request->boolean('all')) {
            $categories = $query->orderBy('name')->get();

            return response()->json([
                'data' => CategoryResource::collection($categories)->resolve(),
                'message' => 'OK',
                'errors' => null,
            ]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $categories = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'data' => [
                'data' => CategoryResource::collection($categories)->resolve(),
                'links' => [
                    'first' => $categories->url(1),
                    'last' => $categories->url($categories->lastPage()),
                    'prev' => $categories->previousPageUrl(),
                    'next' => $categories->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $categories->currentPage(),
                    'last_page' => $categories->lastPage(),
                    'per_page' => $categories->perPage(),
                    'total' => $categories->total(),
                ],
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ms_categories')->where(function ($query) use ($userId, $request) {
                    return $query->where('user_id', $userId)
                        ->where('type', $request->input('type'));
                }),
            ],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'budget_group_id' => [
                'nullable',
                Rule::requiredIf($request->input('type') === 'expense'),
                Rule::exists('ms_budget_groups', 'id')->where('user_id', $userId),
            ],
            'monthly_estimate' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['is_active'] = $data['is_active'] ?? true;
        $data['monthly_estimate'] = $data['monthly_estimate'] ?? 0.00;

        $category = $request->user()->categories()->create($data);
        $category->load('budgetGroup');

        return response()->json([
            'data' => new CategoryResource($category),
            'message' => 'Category created',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $category = $request->user()->categories()->with('budgetGroup')->findOrFail($id);

        return response()->json([
            'data' => new CategoryResource($category),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, $id)
    {
        $category = $request->user()->categories()->findOrFail($id);
        $userId = $request->user()->id;
        $type = $request->input('type', $category->type);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('ms_categories')->where(function ($query) use ($userId, $type) {
                    return $query->where('user_id', $userId)
                        ->where('type', $type);
                })->ignore($category->id),
            ],
            'type' => ['sometimes', Rule::in(['income', 'expense'])],
            'budget_group_id' => [
                'nullable',
                Rule::requiredIf($type === 'expense'),
                Rule::exists('ms_budget_groups', 'id')->where('user_id', $userId),
            ],
            'monthly_estimate' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $category->update($data);
        $category->load('budgetGroup');

        return response()->json([
            'data' => new CategoryResource($category),
            'message' => 'Category updated',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $category = $request->user()->categories()->findOrFail($id);

        // Check if category has transactions
        if (\Illuminate\Support\Facades\DB::table('transactions')->where('category_id', $category->id)->exists()) {
            return response()->json([
                'data' => null,
                'message' => 'Kategori tidak dapat dihapus karena sudah dipakai dalam transaksi.',
                'errors' => ['category' => ['Kategori sudah memiliki riwayat transaksi.']],
            ], 422);
        }

        $category->delete();

        return response()->json([
            'data' => null,
            'message' => 'Category deleted',
            'errors' => null,
        ]);
    }
}
