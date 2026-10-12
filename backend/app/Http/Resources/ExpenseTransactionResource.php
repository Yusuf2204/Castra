<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'type' => $this->category->type,
                    'monthly_estimate' => (float) $this->category->monthly_estimate,
                    'budget_group' => $this->category->budgetGroup ? [
                        'id' => $this->category->budgetGroup->id,
                        'name' => $this->category->budgetGroup->name,
                        'code' => $this->category->budgetGroup->code,
                        'percentage' => (float) $this->category->budgetGroup->percentage,
                    ] : null,
                ] : null;
            }),
            'transaction_date' => $this->transaction_date?->format('Y-m-d') ?? $this->transaction_date,
            'amount' => (float) $this->amount,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
