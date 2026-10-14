<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 28)->nullable()->unique()->after('name');
            $table->string('bio', 280)->nullable()->after('email');
            $table->string('website', 255)->nullable()->after('bio');
            $table->string('avatar_path')->nullable()->after('website');
            $table->boolean('is_admin')->default(false)->after('password');
            $table->boolean('is_active')->default(true)->after('is_admin');
        });

        DB::table('users')->whereNull('username')->orderBy('id')->get(['id', 'name'])->each(function ($user): void {
            $base = strtolower(preg_replace('/[^a-z0-9_]/i', '', (string) $user->name) ?: 'member'.$user->id);
            if (strlen($base) < 3) $base = 'member'.$user->id;
            $base = substr($base, 0, 20);
            $username = $base;
            $suffix = 1;

            while (DB::table('users')->where('username', $username)->exists()) {
                $username = substr($base, 0, 20).$suffix;
                $suffix++;
            }

            DB::table('users')->where('id', $user->id)->update(['username' => $username]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn(['username', 'bio', 'website', 'avatar_path', 'is_admin', 'is_active']);
        });
    }
};
