<?php

use Illuminate\Support\Facades\Route;
use L5Swagger\Http\Middleware\Config as L5SwaggerConfig;

Route::get('/', [
    'uses' => '\L5Swagger\Http\Controllers\SwaggerController@api',
    'l5-swagger.documentation' => 'default',
])->middleware(L5SwaggerConfig::class);
