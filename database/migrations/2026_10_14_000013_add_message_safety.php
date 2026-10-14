<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blocker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('blocked_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['blocker_id', 'blocked_id']);
        });
        foreach (['direct_messages', 'community_chat_messages'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->boolean('is_hidden')->default(false)->index());
        }
        Schema::create('message_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reported_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('message_type', 16);
            $table->unsignedBigInteger('message_id');
            $table->text('reported_body'); // Limited evidence snapshot; never exposed to other members.
            $table->string('reason', 32);
            $table->text('details')->nullable();
            $table->string('status', 16)->default('open')->index();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['reporter_id', 'message_type', 'message_id']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('message_reports');
        Schema::dropIfExists('user_blocks');
        foreach (['direct_messages', 'community_chat_messages'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('is_hidden'));
        }
    }
};
