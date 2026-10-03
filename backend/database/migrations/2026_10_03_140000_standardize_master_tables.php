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
        // 1. Create ms_budget_groups table
        if (! Schema::hasTable('ms_budget_groups')) {
            Schema::create('ms_budget_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('code', 50);
                $table->string('name', 100);
                $table->decimal('percentage', 5, 2)->default(0.00);
                $table->integer('sort_order')->default(0);
                $table->boolean('is_system')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['user_id', 'code']);
            });
        }

        // 2. Rename categories -> ms_categories & add columns
        if (Schema::hasTable('categories') && ! Schema::hasTable('ms_categories')) {
            Schema::rename('categories', 'ms_categories');
        }

        if (Schema::hasTable('ms_categories')) {
            Schema::table('ms_categories', function (Blueprint $table) {
                if (! Schema::hasColumn('ms_categories', 'budget_group_id')) {
                    $table->foreignId('budget_group_id')->nullable()->after('type')
                        ->constrained('ms_budget_groups')->nullOnDelete();
                }
                if (! Schema::hasColumn('ms_categories', 'monthly_estimate')) {
                    $table->decimal('monthly_estimate', 15, 2)->default(0.00)->after('budget_group_id');
                }
                if (! Schema::hasColumn('ms_categories', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('monthly_estimate');
                }
            });
        }

        // 3. Rename income_sources -> ms_income_sources
        if (Schema::hasTable('income_sources') && ! Schema::hasTable('ms_income_sources')) {
            Schema::rename('income_sources', 'ms_income_sources');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ms_income_sources') && ! Schema::hasTable('income_sources')) {
            Schema::rename('ms_income_sources', 'income_sources');
        }

        if (Schema::hasTable('ms_categories')) {
            Schema::table('ms_categories', function (Blueprint $table) {
                if (Schema::hasColumn('ms_categories', 'budget_group_id')) {
                    $table->dropForeign(['budget_group_id']);
                    $table->dropColumn('budget_group_id');
                }
                if (Schema::hasColumn('ms_categories', 'monthly_estimate')) {
                    $table->dropColumn('monthly_estimate');
                }
                if (Schema::hasColumn('ms_categories', 'is_active')) {
                    $table->dropColumn('is_active');
                }
            });

            if (! Schema::hasTable('categories')) {
                Schema::rename('ms_categories', 'categories');
            }
        }

        Schema::dropIfExists('ms_budget_groups');
    }
};
