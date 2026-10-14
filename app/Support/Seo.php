<?php

namespace App\Support;

/**
 * Central per-page metadata so every route renders a unique,
 * indexable title, description, and canonical URL.
 */
final class Seo
{
    private const PAGES = [
        'models' => ['AI Models — free and paid releases', 'Newly released AI models shared by the community, including which ones are free, freemium, or paid.', '/models'],
        'launches' => ['Launches — community projects', 'Discover tools, apps, and websites launched by VibeDock makers.', '/launches'],
        'rankings' => ['Rankings — top tools and makers', 'Community launch votes and the rolling engagement leaderboard.', '/rankings'],
        'community-chat' => ['Community chat', 'Join the shared VibeDock chat and talk with other makers in real time.', '/community-chat'],
        'about' => ['About VibeDock', 'VibeDock is a community for vibe coders, developers, and designers who build with AI.', '/about'],
        'guidelines' => ['Community guidelines', 'The rules that keep VibeDock a kind and useful place to build in public.', '/guidelines'],
        'privacy' => ['Privacy policy', 'How VibeDock stores and uses community and account information.', '/privacy'],
        'terms' => ['Terms of use', 'The terms for using the VibeDock community.', '/terms'],
        'login' => ['Sign in', 'Sign in to your VibeDock account.', '/login'],
        'register' => ['Create your account', 'Join VibeDock free and start sharing what you build.', '/register'],
        'messages' => ['Messages', 'Your private conversations on VibeDock.', '/messages'],
    ];

    public static function page(string $page): array
    {
        $fallback = ['VibeDock | Build together', 'A community for vibe coders and makers who build AI tools, apps, and creative projects.', '/'];

        return [
            'title' => self::PAGES[$page][0] ?? $fallback[0],
            'description' => self::PAGES[$page][1] ?? $fallback[1],
            'path' => self::PAGES[$page][2] ?? $fallback[2],
        ];
    }

    public static function home(): array
    {
        return ['VibeDock | Build together', 'A community for vibe coders and makers: share work in progress, ask questions, run polls, share AI models, and launch projects.', '/'];
    }
}
