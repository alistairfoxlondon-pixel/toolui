<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Support\Seo;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function home(): View
    {
        return view('welcome', ['meta' => Seo::home()]);
    }

    public function feed(): View { return $this->staticPage('feed'); }

    public function editProfile(): View { return $this->staticPage('profile-edit'); }

    public function badges(): View { return $this->staticPage('badges'); }
    public function help(): View { return $this->staticPage('help'); }
    public function create(string $type): View { return $this->staticPage('create-'.$type); }
    public function brand(string $slug): View
    {
        $brand = \App\Models\Brand::where('slug', $slug)->firstOrFail();
        return $this->post($brand->post);
    }

    public function launches(): View
    {
        return $this->staticPage('launches');
    }

    public function rankings(): View
    {
        return $this->staticPage('rankings');
    }

    public function communityChat(): View
    {
        return $this->staticPage('community-chat');
    }

    public function messages(): View
    {
        return $this->staticPage('messages');
    }

    public function about(): View
    {
        return $this->staticPage('about');
    }

    public function guidelines(): View
    {
        return $this->staticPage('guidelines');
    }

    public function privacy(): View
    {
        return $this->staticPage('privacy');
    }

    public function terms(): View
    {
        return $this->staticPage('terms');
    }

    public function login(): View
    {
        return view('welcome', ['meta' => Seo::page('login')]);
    }

    public function register(): View
    {
        return view('welcome', ['meta' => Seo::page('register')]);
    }

    public function profile(string $username): View
    {
        $profile = User::query()->where('username', $username)->where('is_active', true)->first();

        return view('welcome', [
            'profileUsername' => $username,
            'meta' => $profile
                ? [
                    'title' => $profile->name.' (@'.$profile->username.') | VibeDock',
                    'description' => $profile->bio ?: 'Posts and launches by '.$profile->name.' on VibeDock.',
                    'path' => '/u/'.$profile->username,
                ]
                : Seo::home(),
        ]);
    }

    public function post(Post $post): View
    {
        abort_if($post->type === 'model' || $post->is_hidden || ! $post->author?->is_active, 404);
        $title = $post->title ?: Str::limit($post->body, 60);

        return view('welcome', [
            'initialPage' => 'feed',
            'initialPostId' => (string) $post->id,
            'meta' => [
                'title' => $title.' | VibeDock',
                'description' => $post->seo_description ?: ($post->body ? Str::limit($post->body, 155) : 'A community post on VibeDock.'),
                'path' => '/posts/'.$post->id,
            ],
        ]);
    }

    public function sitemap(): Response
    {
        $urls = [
            url('/'),
            url('/feed'),
            url('/badges'),
            url('/help'),
            url('/launches'),
            url('/rankings'),
            url('/community-chat'),
            url('/about'),
            url('/guidelines'),
            url('/privacy'),
            url('/terms'),
        ];

        Post::query()
            ->where('type', '!=', 'model')
            ->where('is_hidden', false)
            ->whereHas('author', fn ($author) => $author->where('is_active', true))
            ->latest()
            ->limit(500)
            ->pluck('id')
            ->each(fn (int $id) => $urls[] = url("/posts/{$id}"));

        User::query()
            ->where('is_active', true)
            ->latest()
            ->limit(500)
            ->pluck('username')
            ->each(fn (string $username) => $urls[] = url('/u/'.rawurlencode($username)));

        $body = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        foreach ($urls as $link) {
            $body .= '  <url><loc>'.htmlspecialchars($link, ENT_XML1).'</loc></url>'."\n";
        }
        $body .= '</urlset>';

        return response($body, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    private function staticPage(string $page): View
    {
        return view('welcome', ['meta' => Seo::page($page), 'initialPage' => $page]);
    }
}
