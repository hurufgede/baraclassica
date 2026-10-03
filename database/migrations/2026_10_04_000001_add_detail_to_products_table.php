<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'condition')) {
                $table->string('condition', 50)->nullable()->after('stock');
            }
            if (! Schema::hasColumn('products', 'surat')) {
                $table->string('surat', 100)->nullable()->after('condition');
            }
            if (! Schema::hasColumn('products', 'garansi')) {
                $table->string('garansi', 100)->nullable()->default('7 hari')->after('surat');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['condition', 'surat', 'garansi']);
        });
    }
};
