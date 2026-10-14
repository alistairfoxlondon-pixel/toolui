<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('image_path');
            $table->string('launch_category', 24)->nullable()->after('category');
        });

        Schema::create('launch_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('vote');
            $table->timestamps();
            $table->unique(['post_id', 'user_id']);
            $table->index(['post_id', 'vote']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('launch_votes');
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['logo_path', 'launch_category']);
        });
    }
};
