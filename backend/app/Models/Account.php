<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $table = 'ms_accounts';

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'account_number',
        'currency',
        'initial_balance',
        'current_balance',
        'imprest_limit',
        'is_active',
    ];

    protected $casts = [
        'initial_balance' => 'float',
        'current_balance' => 'float',
        'imprest_limit' => 'float',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function inTransactions(): HasMany
    {
        return $this->hasMany(IncomeTransaction::class, 'account_id');
    }

    public function outTransactions(): HasMany
    {
        return $this->hasMany(ExpenseTransaction::class, 'account_id');
    }

    public function transfersOut(): HasMany
    {
        return $this->hasMany(FundTransfer::class, 'from_account_id');
    }

    public function transfersIn(): HasMany
    {
        return $this->hasMany(FundTransfer::class, 'to_account_id');
    }

    /**
     * Recalculate and persist the current balance based on initial balance,
     * transactions, and fund transfers.
     */
    public function recalculateBalance(): float
    {
        $incomes = (float) $this->inTransactions()
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'approved');
            })
            ->sum('amount');

        $expenses = (float) $this->outTransactions()
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'approved');
            })
            ->sum('amount');

        $transfersIn = (float) $this->transfersIn()->sum('amount');
        $transfersOut = (float) $this->transfersOut()->sum('amount');

        $this->current_balance = (float) $this->initial_balance + $incomes - $expenses + $transfersIn - $transfersOut;
        $this->save();

        return $this->current_balance;
    }
}
