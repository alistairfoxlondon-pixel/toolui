<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Support\PostPresenter;
use App\Support\AvatarLibrary;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RankingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user();
        $base = Post::query()
            ->where('type', 'launch')
            ->where('is_hidden', false)
            ->whereHas('author', fn ($users) => $users->where('is_active', true))
            ->with(PostPresenter::relations($request->user()))
            ->withCount(['comments', 'likes', 'reposts']);

        $tools = $base->withSum('launchVotes as net_votes', 'vote')
            ->orderByRaw('COALESCE(net_votes, 0) DESC')->orderByDesc('id')->limit(30)->get()
            ->map(fn (Post $post) => PostPresenter::format($post, $viewer));

        $cutoff = now()->subDays(30);
        // Aggregate before joining: joining every like to every comment multiplied
        // rows and made the leaderboard increasingly expensive as posts grew.
        $visiblePosts = DB::table('posts as vp')
            ->join('users as author', 'author.id', '=', 'vp.user_id')
            ->where('vp.is_hidden', false)->where('vp.type', '!=', 'model')
            ->where('author.is_active', true);
        $recentPosts = (clone $visiblePosts)->where('vp.created_at', '>=', $cutoff);
        $postCounts = (clone $recentPosts)->select('vp.user_id')
            ->selectRaw('COUNT(*) as total')->groupBy('vp.user_id');
        $likes = (clone $recentPosts)->join('post_likes as pl', 'pl.post_id', '=', 'vp.id')
            ->join('users as liker', 'liker.id', '=', 'pl.user_id')->where('liker.is_active', true)
            ->where('pl.created_at', '>=', $cutoff)->select('vp.user_id')
            ->selectRaw('COUNT(*) as total')->groupBy('vp.user_id');
        $comments = (clone $recentPosts)->join('comments as c', 'c.post_id', '=', 'vp.id')
            ->join('users as commenter', 'commenter.id', '=', 'c.user_id')->where('commenter.is_active', true)
            ->where('c.created_at', '>=', $cutoff)->select('vp.user_id')
            ->selectRaw('COUNT(*) as total')->groupBy('vp.user_id');
        $written = (clone $visiblePosts)->join('comments as c', 'c.post_id', '=', 'vp.id')
            ->where('c.created_at', '>=', $cutoff)->select('c.user_id')
            ->selectRaw('COUNT(*) as total')->groupBy('c.user_id');
        $leaders = DB::table('users as u')
            ->leftJoinSub($postCounts, 'pc', fn (JoinClause $join) => $join->on('pc.user_id', '=', 'u.id'))
            ->leftJoinSub($likes, 'lc', fn (JoinClause $join) => $join->on('lc.user_id', '=', 'u.id'))
            ->leftJoinSub($comments, 'cc', fn (JoinClause $join) => $join->on('cc.user_id', '=', 'u.id'))
            ->leftJoinSub($written, 'wc', fn (JoinClause $join) => $join->on('wc.user_id', '=', 'u.id'))
            ->where('u.is_active', true)
            ->select('u.id', 'u.name', 'u.username', 'u.profession', 'u.avatar_path', 'u.avatar_choice')
            ->selectRaw('COALESCE(pc.total, 0) as posts_count, COALESCE(lc.total, 0) as likes_received, COALESCE(cc.total, 0) as comments_received, COALESCE(wc.total, 0) as comments_written')
            ->selectRaw('(COALESCE(pc.total, 0) + COALESCE(lc.total, 0) * 2 + COALESCE(cc.total, 0) * 3 + COALESCE(wc.total, 0)) as engagement_score')
            ->orderByDesc('engagement_score')->orderBy('u.name')->orderBy('u.id')
            ->limit(20)
            ->get()
            ->map(fn ($leader, $index) => [
                'rank' => $index + 1,
                'id' => $leader->id,
                'name' => $leader->name,
                'username' => $leader->username,
                'profession' => $leader->profession,
                'avatarUrl' => $leader->avatar_path
                    ? Storage::disk('public')->url($leader->avatar_path)
                    : AvatarLibrary::url($leader->avatar_choice),
                'score' => (int) $leader->engagement_score,
                'postsCount' => (int) $leader->posts_count,
                'likesReceived' => (int) $leader->likes_received,
                'commentsReceived' => (int) $leader->comments_received,
                'commentsWritten' => (int) $leader->comments_written,
            ]);

        return response()->json([
            'tools' => $tools,
            'leaderboard' => $leaders,
            'window' => '30 days',
        ]);
    }
}
