<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    /** @use HasFactory<\Database\Factories\CategoryFactory> */
    use HasFactory;

    protected $table = 'ms_categories';

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'budget_group_id',
        'monthly_estimate',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'monthly_estimate' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function budgetGroup()
    {
        return $this->belongsTo(BudgetGroup::class, 'budget_group_id');
    }

    public function budgetAllocations()
    {
        return $this->hasMany(CategoryBudgetAllocation::class, 'category_id');
    }
}
