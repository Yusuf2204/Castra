<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetGroup extends Model
{
    /** @use HasFactory<\Database\Factories\BudgetGroupFactory> */
    use HasFactory;

    protected $table = 'ms_budget_groups';

    protected $fillable = [
        'user_id',
        'code',
        'name',
        'percentage',
        'sort_order',
        'is_system',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'float',
            'sort_order' => 'integer',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class, 'budget_group_id');
    }
}
