<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetPeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'income_transaction_id' => $this->income_transaction_id,
            'total_income_allocated' => (float) $this->total_income_allocated,
            'total_allocated' => (float) $this->allocations->sum('allocated_amount'),
            'is_active' => (bool) $this->is_active,
            'notes' => $this->notes,
            'allocations' => CategoryBudgetAllocationResource::collection($this->whenLoaded('allocations')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

