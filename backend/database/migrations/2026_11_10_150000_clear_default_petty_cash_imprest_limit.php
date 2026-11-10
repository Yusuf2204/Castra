<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Clears the confusing default 2,000,000 imprest limit on petty cash accounts.
     */
    public function up(): void
    {
        DB::table('ms_accounts')
            ->where('imprest_limit', 2000000.00)
            ->update(['imprest_limit' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('ms_accounts')
            ->where('type', 'petty_cash')
            ->whereNull('imprest_limit')
            ->update(['imprest_limit' => 2000000.00]);
    }
};
