<?php

use App\Http\Controllers\Api\AuthController;
// Route Controllers
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RoleMenuController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// MAIN
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::get('company', [CompanyController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard-summary', [DashboardController::class, 'summary']);

    // Setup
    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class)->except(['show']);
    Route::apiResource('menus', MenuController::class);
    Route::get('menus-tree', [MenuController::class, 'tree']);
    Route::get('role-menus/{role}', [RoleMenuController::class, 'show']);
    Route::post('role-menus/{role}', [RoleMenuController::class, 'store']);
    Route::post('change-password', [UserController::class, 'changePassword']);
    Route::put('company', [CompanyController::class, 'update']);
});
