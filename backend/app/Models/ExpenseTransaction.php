<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ExpenseTransaction extends Model
{
    use HasFactory;

    protected $table = 'out_transactions';

    protected $fillable = [
        'user_id',
        'account_id',
        'category_id',
        'transaction_date',
        'amount',
        'voucher_no',
        'payee',
        'notes',
        'attachment_path',
    ];

    protected $casts = [
        'transaction_date' => 'date:Y-m-d',
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

        return Storage::disk('public')->url(ltrim($this->attachment_path, '/'));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }
}
