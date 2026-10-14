<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#4c5cda">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="A welcoming community for people who make AI tools, apps, and creative projects.">
    <title>VibeDock | Build together</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    @vite('resources/js/app.js')
</head>
<body>
    <a class="skip-link" href="#app">Skip to content</a>
    <div id="app" tabindex="-1"></div>
    @php
        $initialPage = match (true) {
            request()->is('launches') => 'launches',
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
                'skills' => auth()->user()->skills ?? [],
                'avatarChoice' => auth()->user()->avatar_choice,
                'avatarUploaded' => (bool) auth()->user()->avatar_path,
                'avatarUrl' => auth()->user()->avatar_path ? Storage::disk('public')->url(auth()->user()->avatar_path) : asset('avatars/'.(auth()->user()->avatar_choice ?: 'neutral').'.svg'),
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
