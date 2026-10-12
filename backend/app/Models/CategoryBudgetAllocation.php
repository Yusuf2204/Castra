<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoryBudgetAllocation extends Model
{
    use HasFactory;

    protected $table = 'ms_category_budget_allocations';

    protected $fillable = [
        'user_id',
        'budget_period_id',
        'category_id',
        'allocated_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'allocated_amount' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function budgetPeriod()
    {
        return $this->belongsTo(BudgetPeriod::class, 'budget_period_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}

