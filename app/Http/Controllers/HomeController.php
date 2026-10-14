<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(): View
    {
        return view('welcome');
    }

    public function profile(string $username): View
    {
        return view('welcome', ['profileUsername' => $username]);
    }

    public function post(Post $post): View
    {
        return view('welcome', ['initialPostId' => (string) $post->id]);
    }
}
