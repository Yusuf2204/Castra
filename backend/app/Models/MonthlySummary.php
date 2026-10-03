<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlySummary extends Model
{
    use HasFactory;

    protected $table = 'rpt_monthly_summaries';

    protected $fillable = [
        'user_id',
        'year',
        'month',
        'total_income',
        'total_expense',
        'net_balance',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'total_income' => 'float',
        'total_expense' => 'float',
        'net_balance' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
