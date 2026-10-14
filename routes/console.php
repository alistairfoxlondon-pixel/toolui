<?php

use App\Models\User;
use Database\Seeders\DemoAccountsSeeder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('vibedock:make-admin {email}', function (string $email) {
    $user = User::query()->where('email', $email)->first();

    if (! $user) {
        $this->error('No member exists with that email address.');
        return 1;
    }

    $user->forceFill(['is_admin' => true])->save();
    $this->info('Administrator access granted to @'.$user->username.'.');

    return 0;
})->purpose('Grant administrator access to an existing member');

Artisan::command('vibedock:seed-demo', function () {
    if (app()->environment('production')) {
        $this->error('Demo accounts are disabled in production.');
        return 1;
    }

    $this->call('db:seed', ['--class' => DemoAccountsSeeder::class]);
    $this->newLine();
    $this->info('Local demo accounts created. Do not deploy these passwords.');
    $this->line('Member: demo@vibedock.test / VibeDockDemo2026!');
    $this->line('Admin:  admin@vibedock.test / VibeDockAdmin2026!');

    return 0;
})->purpose('Create safe local only demo member and administrator accounts');
