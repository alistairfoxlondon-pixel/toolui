<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cover_choice', 24)->default('aurora')->after('avatar_choice');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->string('model_provider', 60)->nullable()->after('launch_category');
            $table->string('model_access', 12)->nullable()->after('model_provider');
            $table->boolean('is_featured')->default(false)->after('is_hidden');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('cover_choice');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['model_provider', 'model_access', 'is_featured']);
        });
    }
};
