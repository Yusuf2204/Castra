<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function cashFlow(Request $request)
    {
        $year = (int) $request->input('year', Carbon::now()->year);
        $user = $request->user();

        $data = $this->reportService->getCashFlow($user, $year);

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function budgetComparison(Request $request)
    {
        $monthStr = $request->input('month', Carbon::now()->format('Y-m'));
        $user = $request->user();

        $data = $this->reportService->getBudgetComparison($user, $monthStr);

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }

    public function categoryBreakdown(Request $request)
    {
        $monthStr = $request->input('month', Carbon::now()->format('Y-m'));
        $user = $request->user();

        $data = $this->reportService->getCategoryBreakdown($user, $monthStr);

        return response()->json([
            'data' => $data,
            'message' => 'OK',
            'errors' => null,
        ]);
    }
}
