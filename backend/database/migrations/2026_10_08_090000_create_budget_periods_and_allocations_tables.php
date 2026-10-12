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
        // 1. Create ms_budget_periods table
        if (! Schema::hasTable('ms_budget_periods')) {
            Schema::create('ms_budget_periods', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('name', 100);
                $table->date('start_date');
                $table->date('end_date');
                $table->foreignId('income_transaction_id')->nullable()
                    ->constrained('in_transactions')->nullOnDelete();
                $table->decimal('total_income_allocated', 15, 2)->default(0.00);
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'start_date', 'end_date'], 'idx_bp_user_dates');
                $table->index(['user_id', 'is_active'], 'idx_bp_user_active');
            });
        }

        // 2. Create ms_category_budget_allocations table
        if (! Schema::hasTable('ms_category_budget_allocations')) {
            Schema::create('ms_category_budget_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('budget_period_id')->constrained('ms_budget_periods')->onDelete('cascade');
                $table->foreignId('category_id')->constrained('ms_categories')->onDelete('cascade');
                $table->decimal('allocated_amount', 15, 2)->default(0.00);
                $table->string('notes', 255)->nullable();
                $table->timestamps();

                $table->unique(['budget_period_id', 'category_id'], 'uniq_bp_cat_allocation');
                $table->index(['user_id', 'budget_period_id'], 'idx_cb_user_bp');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ms_category_budget_allocations');
        Schema::dropIfExists('ms_budget_periods');
    }
};

