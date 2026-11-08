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
            'account_id' => $this->account_id,
            'account' => $this->whenLoaded('account', function () {
                return $this->account ? [
                    'id' => $this->account->id,
                    'name' => $this->account->name,
                    'type' => $this->account->type,
                    'currency' => $this->account->currency,
                ] : null;
            }),
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
            'currency' => $this->currency ?? 'IDR',
            'exchange_rate' => (float) ($this->exchange_rate ?? 1.0),
            'voucher_no' => $this->voucher_no,
            'payee' => $this->payee,
            'notes' => $this->notes,
            'status' => $this->status ?? 'approved',
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toISOString(),
            'approver' => $this->whenLoaded('approver', function () {
                return $this->approver ? [
                    'id' => $this->approver->id,
                    'name' => $this->approver->name,
                ] : null;
            }),
            'parent_id' => $this->parent_id,
            'children' => ExpenseTransactionResource::collection($this->whenLoaded('children')),
            'attachment_path' => $this->attachment_path,
            'attachment_url' => $this->attachment_url,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
