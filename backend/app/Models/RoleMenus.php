<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleMenus extends Model
{
    protected $table = 'rolemenus';
    protected $fillable = [
        'role_id',
        'menu_id',
    ];
}
