<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryBudgetAllocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'budget_period_id' => $this->budget_period_id,
            'category_id' => $this->category_id,
            'category_name' => $this->category?->name,
            'category_type' => $this->category?->type,
            'budget_group' => $this->category?->budgetGroup ? [
                'id' => $this->category->budgetGroup->id,
                'name' => $this->category->budgetGroup->name,
                'percentage' => (float) $this->category->budgetGroup->percentage,
            ] : null,
            'baseline_estimate' => (float) ($this->category?->monthly_estimate ?? 0),
            'allocated_amount' => (float) $this->allocated_amount,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

