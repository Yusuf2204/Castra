<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IncomeSourceResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Income Sources (Sumber Dana) CRUD, scoped per authenticated user.
 *
 * OpenAPI annotations for these endpoints live in app/OpenApi/ApiDocumentation.php
 * because l5-swagger in this project scans that directory.
 */
class IncomeSourceController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $query = $request->user()->incomeSources();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $incomeSources = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'data' => [
                'data' => IncomeSourceResource::collection($incomeSources)->resolve(),
                'links' => [
                    'first' => $incomeSources->url(1),
                    'last' => $incomeSources->url($incomeSources->lastPage()),
                    'prev' => $incomeSources->previousPageUrl(),
                    'next' => $incomeSources->nextPageUrl(),
                ],
                'meta' => [
                    'current_page' => $incomeSources->currentPage(),
                    'last_page' => $incomeSources->lastPage(),
                    'per_page' => $incomeSources->perPage(),
                    'total' => $incomeSources->total(),
                ],
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('income_sources')->where('user_id', $request->user()->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['is_active'] = $data['is_active'] ?? true;

        $incomeSource = $request->user()->incomeSources()->create($data);

        return response()->json([
            'data' => new IncomeSourceResource($incomeSource),
            'message' => 'Income source created',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $incomeSource = $request->user()->incomeSources()->findOrFail($id);

        return response()->json([
            'data' => new IncomeSourceResource($incomeSource),
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function update(Request $request, $id)
    {
        $incomeSource = $request->user()->incomeSources()->findOrFail($id);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('income_sources')->where('user_id', $request->user()->id)->ignore($incomeSource->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ]);

        $incomeSource->update($data);

        return response()->json([
            'data' => new IncomeSourceResource($incomeSource),
            'message' => 'Income source updated',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $incomeSource = $request->user()->incomeSources()->findOrFail($id);
        $incomeSource->delete();

        return response()->json([
            'data' => null,
            'message' => 'Income source deleted',
            'errors' => null,
        ]);
    }
}
