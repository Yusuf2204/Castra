<?php

namespace App\Models;

use App\Models\Menus;
use Illuminate\Database\Eloquent\Model;

class Roles extends Model
{
    protected $table = 'roles';
    protected $fillable = ['role_name'];

    public function menus()
    {
        return $this->belongsToMany(
            Menus::class,
            'rolemenus',
            'role_id',
            'menu_id'
        );
    }
}
