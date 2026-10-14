<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profession', 80)->nullable()->after('bio');
            $table->json('skills')->nullable()->after('profession');
            $table->string('avatar_choice', 24)->default('neutral')->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profession', 'skills', 'avatar_choice']);
        });
    }
};
