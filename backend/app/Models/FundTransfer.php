<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class FundTransfer extends Model
{
    use HasFactory;

    protected $table = 'fund_transfers';

    protected $fillable = [
        'user_id',
        'from_account_id',
        'to_account_id',
        'transfer_date',
        'amount',
        'reference_no',
        'notes',
        'attachment_path',
    ];

    protected $casts = [
        'transfer_date' => 'date:Y-m-d',
        'amount' => 'float',
    ];

    protected $appends = [
        'attachment_url',
    ];

    public function getAttachmentUrlAttribute(): ?string
    {
        if (! $this->attachment_path) {
            return null;
        }

        if (str_starts_with($this->attachment_path, 'http://') || str_starts_with($this->attachment_path, 'https://')) {
            return $this->attachment_path;
        }

        return '/storage/' . ltrim($this->attachment_path, '/');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fromAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }
}
