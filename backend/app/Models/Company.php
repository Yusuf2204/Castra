<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'companies';

    protected $fillable = [
        'comp_name',
        'comp_logo',
        'fav_icon',
        'app_title',
    ];
}
