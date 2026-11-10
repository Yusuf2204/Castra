<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Safely drops unused legacy tables that have been superseded by modern tables.
     */
    public function up(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('monthly_summaries');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('category_id')->constrained('ms_categories')->onDelete('cascade');
                $table->date('date');
                $table->string('description');
                $table->decimal('amount', 15, 2);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('monthly_summaries')) {
            Schema::create('monthly_summaries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->year('year');
                $table->tinyInteger('month');
                $table->decimal('total_income', 15, 2)->default(0);
                $table->decimal('total_expense', 15, 2)->default(0);
                $table->decimal('net', 15, 2)->default(0);
                $table->unique(['user_id', 'year', 'month']);
                $table->timestamps();
            });
        }
    }
};
