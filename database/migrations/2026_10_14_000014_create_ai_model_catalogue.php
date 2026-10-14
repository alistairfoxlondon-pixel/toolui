<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_models', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('provider', 80);
            $table->string('description', 500);
            $table->string('website_url', 2048)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
        Schema::create('ai_model_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_model_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->timestamps();
            $table->unique(['ai_model_id', 'user_id']);
        });
        Schema::table('posts', fn (Blueprint $table) => $table->string('seo_description', 160)->nullable());
    }
    public function down(): void
    {
        Schema::dropIfExists('ai_model_ratings');
        Schema::dropIfExists('ai_models');
        Schema::table('posts', fn (Blueprint $table) => $table->dropColumn('seo_description'));
    }
};
