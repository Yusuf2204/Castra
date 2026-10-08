<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetPeriod extends Model
{
    use HasFactory;

    protected $table = 'ms_budget_periods';

    protected $fillable = [
        'user_id',
        'name',
        'start_date',
        'end_date',
        'income_transaction_id',
        'total_income_allocated',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'total_income_allocated' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function incomeTransaction()
    {
        return $this->belongsTo(IncomeTransaction::class, 'income_transaction_id');
    }

    public function allocations()
    {
        return $this->hasMany(CategoryBudgetAllocation::class, 'budget_period_id');
    }
}

