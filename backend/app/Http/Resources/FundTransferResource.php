<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FundTransferResource extends JsonResource
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
            'from_account_id' => $this->from_account_id,
            'from_account' => $this->whenLoaded('fromAccount', function () {
                return $this->fromAccount ? [
                    'id' => $this->fromAccount->id,
                    'name' => $this->fromAccount->name,
                    'type' => $this->fromAccount->type,
                ] : null;
            }),
            'to_account_id' => $this->to_account_id,
            'to_account' => $this->whenLoaded('toAccount', function () {
                return $this->toAccount ? [
                    'id' => $this->toAccount->id,
                    'name' => $this->toAccount->name,
                    'type' => $this->toAccount->type,
                ] : null;
            }),
            'transfer_date' => $this->transfer_date?->format('Y-m-d') ?? $this->transfer_date,
            'amount' => (float) $this->amount,
            'reference_no' => $this->reference_no,
            'notes' => $this->notes,
            'attachment_path' => $this->attachment_path,
            'attachment_url' => $this->attachment_url,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
