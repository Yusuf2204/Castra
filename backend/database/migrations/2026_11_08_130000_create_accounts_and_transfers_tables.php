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
        Schema::create('ms_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('type', 30)->default('cash'); // petty_cash, cash, bank, e_wallet, other
            $table->string('account_number', 50)->nullable();
            $table->string('currency', 10)->default('IDR');
            $table->decimal('initial_balance', 15, 2)->default(0.00);
            $table->decimal('current_balance', 15, 2)->default(0.00);
            $table->decimal('imprest_limit', 15, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'type']);
        });

        Schema::create('fund_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('from_account_id')->constrained('ms_accounts')->restrictOnDelete();
            $table->foreignId('to_account_id')->constrained('ms_accounts')->restrictOnDelete();
            $table->date('transfer_date');
            $table->decimal('amount', 15, 2);
            $table->string('reference_no', 50)->nullable();
            $table->text('notes')->nullable();
            $table->string('attachment_path', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'transfer_date']);
        });

        Schema::table('out_transactions', function (Blueprint $table) {
            $table->foreignId('account_id')->nullable()->after('category_id')->constrained('ms_accounts')->nullOnDelete();
        });

        Schema::table('in_transactions', function (Blueprint $table) {
            $table->foreignId('account_id')->nullable()->after('income_source_id')->constrained('ms_accounts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('in_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('account_id');
        });

        Schema::table('out_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('account_id');
        });

        Schema::dropIfExists('fund_transfers');
        Schema::dropIfExists('ms_accounts');
    }
};
