<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function show()
    {
        return response()->json([
            'data' => Company::first(),
            'message' => 'OK',
            'errors' => null
        ]);
    }

    public function update(Request $request)
    {
        $company = Company::first();

        $data = $request->validate([
            'comp_name' => 'required',
            'comp_logo' => 'nullable',
            'fav_icon' => 'nullable',
            'app_title' => 'nullable',
        ]);

        $company->update($data);

        return response()->json([
            'data' => $company,
            'message' => 'Updated',
            'errors' => null
        ]);
    }
}
