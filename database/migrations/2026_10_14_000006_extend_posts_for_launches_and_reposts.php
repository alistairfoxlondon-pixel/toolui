<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('project_url');
            $table->foreignId('source_post_id')->nullable()->after('image_path')->constrained('posts')->nullOnDelete();
            $table->boolean('is_hidden')->default(false)->after('options');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('source_post_id');
            $table->dropColumn(['image_path', 'is_hidden']);
        });
    }
};
