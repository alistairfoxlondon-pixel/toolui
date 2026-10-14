<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommunityChatController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MessageSafetyController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RankingController;
use App\Http\Controllers\SocialAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'home'])->name('home');
Route::get('/feed', [HomeController::class, 'feed'])->name('feed.page');
Route::get('/settings/profile', [HomeController::class, 'editProfile'])->middleware(['auth', 'active'])->name('profile.edit');
// Legacy poll URLs now open the poll filter inside the unified community feed.
Route::redirect('/models', '/feed?filter=poll', 301);
Route::redirect('/polls', '/feed?filter=poll', 301);
Route::get('/badges', [HomeController::class, 'badges'])->name('badges.page');
Route::get('/help', [HomeController::class, 'help'])->name('help.page');
Route::get('/create/{type}', [HomeController::class, 'create'])->whereIn('type', ['post', 'question', 'poll', 'launch'])->name('create.page');
Route::get('/brands/{slug}', [HomeController::class, 'brand'])->name('brands.show');
Route::get('/launches', [HomeController::class, 'launches'])->name('launches.page');
Route::get('/rankings', [HomeController::class, 'rankings'])->name('rankings.page');
Route::get('/community-chat', [HomeController::class, 'communityChat'])->name('community-chat.page');
Route::get('/messages', [HomeController::class, 'messages'])->middleware(['auth', 'active'])->name('messages.page');
Route::get('/about', [HomeController::class, 'about'])->name('about.page');
Route::get('/guidelines', [HomeController::class, 'guidelines'])->name('guidelines.page');
Route::get('/privacy', [HomeController::class, 'privacy'])->name('privacy.page');
Route::get('/terms', [HomeController::class, 'terms'])->name('terms.page');
Route::get('/login', [HomeController::class, 'login'])->middleware('guest')->name('login');
Route::get('/register', [HomeController::class, 'register'])->middleware('guest')->name('register');
Route::get('/u/{username}', [HomeController::class, 'profile'])->name('profiles.show');
Route::get('/posts/{post}', [HomeController::class, 'post'])->name('posts.show');

Route::get('/sitemap.xml', [HomeController::class, 'sitemap'])->name('sitemap');

Route::middleware(['guest', 'throttle:8,1'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

Route::middleware(['guest', 'throttle:12,1'])->prefix('auth')->name('social.')->group(function () {
    Route::get('/{provider}/redirect', [SocialAuthController::class, 'redirect'])
        ->whereIn('provider', ['google', 'facebook'])
        ->name('redirect');
    Route::get('/{provider}/callback', [SocialAuthController::class, 'callback'])
        ->whereIn('provider', ['google', 'facebook'])
        ->name('callback');
});

Route::get('/api/posts/{post}', [PostController::class, 'show'])->name('api.posts.show');
Route::get('/api/feed', [PostController::class, 'index'])->name('api.feed');
Route::get('/api/search', [ProfileController::class, 'search'])->name('api.search');
Route::get('/api/users/{username}', [ProfileController::class, 'show'])->name('api.users.show');
Route::get('/api/rankings', [RankingController::class, 'index'])->name('api.rankings');

Route::middleware(['auth', 'active', 'throttle:120,1'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::put('/api/profile', [ProfileController::class, 'update'])->name('api.profile.update');
    Route::get('/api/friend-requests', [ProfileController::class, 'friendRequests'])->name('api.friend-requests.index');
    Route::post('/api/friend-requests/{friendRequest}/respond', [ProfileController::class, 'respondFriendRequest'])->name('api.friend-requests.respond');
    Route::post('/api/users/{user}/follow', [ProfileController::class, 'toggleFollow'])->name('api.users.follow');
    Route::post('/api/users/{user}/friend-request', [ProfileController::class, 'sendFriendRequest'])->name('api.users.friend-request');
    Route::delete('/api/users/{user}/friendship', [ProfileController::class, 'removeFriend'])->name('api.users.friendship.remove');

    Route::get('/api/blocks', [MessageSafetyController::class, 'blocks']);
    Route::post('/api/users/{user}/block', [MessageSafetyController::class, 'block']);
    Route::delete('/api/users/{user}/block', [MessageSafetyController::class, 'unblock']);
    Route::post('/api/message-reports/{type}/{message}', [MessageSafetyController::class, 'report'])->whereIn('type', ['community', 'direct'])->whereNumber('message')->middleware('throttle:message-report');

    Route::get('/api/messages', [MessageController::class, 'conversations'])->name('api.messages.index');
    Route::get('/api/messages/{user}', [MessageController::class, 'thread'])->name('api.messages.thread');
    Route::post('/api/messages/{user}', [MessageController::class, 'send'])->middleware('throttle:message-send')->name('api.messages.send');

    Route::get('/api/community-chat', [CommunityChatController::class, 'index'])->name('api.community-chat.index');
    Route::post('/api/community-chat', [CommunityChatController::class, 'store'])->middleware('throttle:message-send')->name('api.community-chat.store');

    Route::post('/api/posts', [PostController::class, 'store'])->name('api.posts.store');
    Route::post('/api/posts/{post}/vote', [PostController::class, 'vote'])->name('api.posts.vote');
    Route::post('/api/launches/{post}/vote', [PostController::class, 'voteLaunch'])->name('api.launches.vote');
    Route::post('/api/posts/{post}/like', [PostController::class, 'toggleLike'])->name('api.posts.like');
    Route::post('/api/posts/{post}/react', [PostController::class, 'react'])->name('api.posts.react');
    Route::post('/api/posts/{post}/comments', [PostController::class, 'comment'])->name('api.posts.comments.store');
    Route::post('/api/posts/{post}/report', [PostController::class, 'report'])->name('api.posts.report');
    Route::post('/api/posts/{post}/repost', [PostController::class, 'repost'])->name('api.posts.repost');
});

Route::middleware(['auth', 'active', 'admin', 'throttle:60,1'])->prefix('admin')->name('admin.')->group(function () {
    Route::patch('/users/{user}/badge', [AdminController::class, 'setBadge'])->name('users.badge');
    Route::patch('/brands/{brand}', [AdminController::class, 'reviewBrand'])->name('brands.review');
    Route::get('/', [AdminController::class, 'index'])->name('dashboard');
    Route::patch('/posts/{post}/visibility', [AdminController::class, 'setPostVisibility'])->name('posts.visibility');
    Route::patch('/posts/{post}/featured', [AdminController::class, 'setPostFeatured'])->name('posts.featured');
    Route::delete('/posts/{post}', [AdminController::class, 'deletePost'])->name('posts.delete');
    Route::patch('/users/{user}/status', [AdminController::class, 'setUserStatus'])->name('users.status');
    Route::patch('/users/{user}/role', [AdminController::class, 'setAdminRole'])->name('users.role');
    Route::post('/reports/{report}/review', [AdminController::class, 'resolveReport'])->name('reports.review');
    Route::post('/message-reports/{report}/review', [AdminController::class, 'reviewMessageReport'])->name('message-reports.review');
    Route::delete('/community-chat/{message}', [AdminController::class, 'deleteCommunityChatMessage'])->name('community-chat.delete');
    Route::delete('/comments/{comment}', [AdminController::class, 'deleteComment'])->name('comments.delete');
});
