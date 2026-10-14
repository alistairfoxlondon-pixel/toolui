<?php

namespace Database\Seeders;

use App\Models\CommunityChatMessage;
use App\Models\FriendRequest;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DemoAccountsSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException('Demo accounts must never be seeded into a production environment.');
        }

        $member = User::updateOrCreate(
            ['email' => 'demo@vibedock.test'],
            [
                'name' => 'VibeDock Demo Maker',
                'username' => 'demomaker',
                'bio' => 'Trying small ideas and sharing what I learn.',
                'profession' => 'Independent maker',
                'skills' => ['Prototyping', 'AI tools', 'Product design'],
                'website' => 'https://example.com',
                'avatar_choice' => 'female-violet',
                'password' => 'VibeDockDemo2026!',
                'is_active' => true,
            ],
        );
        $member->forceFill(['is_admin' => false])->save();

        $admin = User::updateOrCreate(
            ['email' => 'admin@vibedock.test'],
            [
                'name' => 'VibeDock Demo Admin',
                'username' => 'demoadmin',
                'bio' => 'A local testing account for community moderation.',
                'profession' => 'Community moderator',
                'skills' => ['Community building'],
                'avatar_choice' => 'male-indigo',
                'password' => 'VibeDockAdmin2026!',
                'is_active' => true,
            ],
        );
        $admin->forceFill(['is_admin' => true])->save();

        Post::firstOrCreate(
            ['user_id' => $member->id, 'title' => 'A first version is a good place to start'],
            [
                'type' => 'discussion',
                'body' => 'I shared my first small prototype before it felt finished. What is one thing you are making this week?',
                'category' => 'Build in public',
            ],
        );

        Post::firstOrCreate(
            ['user_id' => $member->id, 'title' => 'PocketBrief, a calmer AI research workspace'],
            [
                'type' => 'launch',
                'body' => 'A small workspace for collecting research and turning notes into a clear brief.',
                'category' => 'First launch',
                'launch_category' => 'ai_tool',
                'project_url' => 'https://example.com',
            ],
        );

        Post::firstOrCreate(
            ['user_id' => $member->id, 'title' => 'Which part of your first launch felt hardest?'],
            [
                'type' => 'poll',
                'body' => 'A quick check in for makers.',
                'options' => ['Choosing what to build', 'Finding early users', 'Finishing the first version'],
                'category' => 'First launch',
            ],
        );

        FriendRequest::updateOrCreate(
            ['sender_id' => $member->id, 'recipient_id' => $admin->id],
            ['status' => 'accepted', 'responded_at' => now()],
        );

        if (! CommunityChatMessage::query()->exists()) {
            CommunityChatMessage::create([
                'user_id' => $member->id,
                'body' => 'Welcome to the community chat. Share what you are making today.',
            ]);
        }
    }
}
