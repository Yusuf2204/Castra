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
            $table->string('currency', 10)->default('IDR')->after('amount');
            $table->decimal('exchange_rate', 15, 6)->default(1.000000)->after('currency');
            $table->string('status', 20)->default('approved')->after('notes'); // draft, submitted, approved, rejected
            $table->foreignId('approved_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->foreignId('parent_id')->nullable()->after('approved_at')->constrained('out_transactions')->cascadeOnDelete();

            $table->index(['user_id', 'status']);
        });

        Schema::table('in_transactions', function (Blueprint $table) {
            $table->string('currency', 10)->default('IDR')->after('amount');
            $table->decimal('exchange_rate', 15, 6)->default(1.000000)->after('currency');
            $table->string('status', 20)->default('approved')->after('notes');

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('in_transactions', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
            $table->dropColumn(['currency', 'exchange_rate', 'status']);
        });

        Schema::table('out_transactions', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['approved_by']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropColumn(['currency', 'exchange_rate', 'status', 'approved_by', 'approved_at', 'parent_id']);
        });
    }
};
