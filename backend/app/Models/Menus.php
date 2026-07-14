<?php

namespace App\Models;

use App\Models\Roles;
use Illuminate\Database\Eloquent\Model;

class Menus extends Model
{
    protected $table = 'menus';
    protected $fillable = [
        'menu_name',
        'menu_path',
        'menu_icon',
        'menu_parent_id',
        'menu_order',
    ];

    public function parent()
    {
        return $this->belongsTo(Menus::class, 'menu_parent_id');
    }

    public function children()
    {
        return $this->hasMany(Menus::class, 'menu_parent_id')->orderBy('menu_order');
    }

    public function roles()
    {
        return $this->belongsToMany(
            Roles::class,
            'rolemenus',
            'menu_id',
            'role_id'
        );
    }
}
