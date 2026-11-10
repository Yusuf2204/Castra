<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('out_transactions', function (Blueprint $table) {
            $table->string('voucher_no', 50)->nullable()->after('amount')->index();
            $table->string('payee', 150)->nullable()->after('voucher_no');
            $table->string('attachment_path', 255)->nullable()->after('notes');
        });

        Schema::table('in_transactions', function (Blueprint $table) {
            $table->string('voucher_no', 50)->nullable()->after('amount')->index();
            $table->string('attachment_path', 255)->nullable()->after('notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('out_transactions', function (Blueprint $table) {
            $table->dropIndex(['voucher_no']);
            $table->dropColumn(['voucher_no', 'payee', 'attachment_path']);
        });

        Schema::table('in_transactions', function (Blueprint $table) {
            $table->dropIndex(['voucher_no']);
            $table->dropColumn(['voucher_no', 'attachment_path']);
        });
    }
};
