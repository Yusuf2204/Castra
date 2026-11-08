<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncomeTransactionResource extends JsonResource
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
            'income_source_id' => $this->income_source_id,
            'income_source' => $this->whenLoaded('incomeSource', function () {
                return [
                    'id' => $this->incomeSource->id,
                    'name' => $this->incomeSource->name,
                ];
            }),
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'type' => $this->category->type,
                ] : null;
            }),
            'transaction_date' => $this->transaction_date?->format('Y-m-d') ?? $this->transaction_date,
            'amount' => (float) $this->amount,
            'voucher_no' => $this->voucher_no,
            'notes' => $this->notes,
            'attachment_path' => $this->attachment_path,
            'attachment_url' => $this->attachment_url,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
