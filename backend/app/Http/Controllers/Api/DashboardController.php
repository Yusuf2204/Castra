<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menus;
use App\Models\Roles;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function summary(Request $request)
    {
        $user = $request->user()->loadMissing('role:id,role_name');
        $financialSummary = $this->reportService->getDashboardSummary($user);

        return response()->json([
            'data' => [
                'system' => [
                    'total_users' => User::count(),
                    'total_roles' => Roles::count(),
                    'total_menus' => Menus::count(),
                    'active_role' => $user->role?->role_name,
                ],
                'finance' => $financialSummary,
            ],
            'message' => 'OK',
            'errors' => null,
        ]);
    }
}
