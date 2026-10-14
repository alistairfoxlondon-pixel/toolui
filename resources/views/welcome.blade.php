<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#28724F">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @php
        $meta = $meta ?? ['title' => 'VibeDock | Build together', 'description' => 'A community for vibe coders and makers who build AI tools, apps, and creative projects.', 'path' => '/'];
        $canonical = url($meta['path']);
        $initialPage = $initialPage ?? match (true) {
            request()->is('feed') || request()->is('posts/*') => 'feed',
            request()->is('settings/profile') => 'profile-edit',
            request()->is('launches') => 'launches',
            request()->is('models') => 'models',
            request()->is('rankings') => 'rankings',
            request()->is('community-chat') => 'community-chat',
            request()->is('messages') => 'messages',
            request()->is('about') => 'about',
            request()->is('guidelines') => 'guidelines',
            request()->is('privacy') => 'privacy',
            request()->is('terms') => 'terms',
            request()->is('u/*') => 'profile',
            default => 'home',
        };
    @endphp
    <title>{{ $meta['title'] }}</title>
    <meta name="description" content="{{ $meta['description'] }}">
    @if (in_array($initialPage, ['profile-edit', 'messages', 'admin']) || request()->is('login', 'register', 'create/*'))
        <meta name="robots" content="noindex, nofollow">
    @endif
    <link rel="canonical" href="{{ $canonical }}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="VibeDock">
    <meta property="og:title" content="{{ $meta['title'] }}">
    <meta property="og:description" content="{{ $meta['description'] }}">
    <meta property="og:url" content="{{ $canonical }}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ $meta['title'] }}">
    <meta name="twitter:description" content="{{ $meta['description'] }}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    @if ($initialPage === 'home' && $meta['path'] === '/')
        <link rel="preload" as="image" href="/images/makers-together.webp"
              imagesrcset="/images/makers-together-small.webp 440w, /images/makers-together.webp 880w"
              imagesizes="(max-width: 600px) 240px, (max-width: 860px) 320px, 440px" fetchpriority="high">
    @endif
    @vite('resources/js/app.js')
    @if ($initialPage === 'home' && $meta['path'] === '/')
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "VibeDock",
            "url": {{ json_encode(url('/')) }},
            "description": {{ json_encode($meta['description']) }}
        }
        </script>
    @endif
</head>
<body>
    <a class="skip-link" href="#app">Skip to content</a>
    <div id="app" tabindex="-1"></div>
    <script>
        window.VibeDockConfig = {
            apiEnabled: true,
            currentUser: @json(auth()->user() ? [
                'id' => auth()->user()->id,
                'name' => auth()->user()->name,
                'username' => auth()->user()->username,
                'email' => auth()->user()->email,
                'bio' => auth()->user()->bio,
                'profession' => auth()->user()->profession,
                'website' => auth()->user()->website,
                'skills' => auth()->user()->skills ?? [],
                'avatarChoice' => auth()->user()->avatar_choice,
                'coverChoice' => \App\Support\CoverLibrary::valid(auth()->user()->cover_choice),
                'avatarUploaded' => (bool) auth()->user()->avatar_path,
                'avatarUrl' => auth()->user()->avatar_path ? Storage::disk('public')->url(auth()->user()->avatar_path) : \App\Support\AvatarLibrary::url(auth()->user()->avatar_choice),
                'isAdmin' => (bool) auth()->user()->is_admin,
            ] : null),
            initialPage: @json($initialPage),
            profileUsername: @json($profileUsername ?? request()->route('username')),
            initialPostId: @json($initialPostId ?? request()->route('post')?->id),
            initialAuthMode: @json(request()->is('login') ? 'login' : (request()->is('register') ? 'register' : null)),
            flashMessage: @json(session('auth_error') ?? session('status'))
        };
    </script>
</body>
</html>
