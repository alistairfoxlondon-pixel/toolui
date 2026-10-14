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
    private array $postRelations = [
        'author:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin',
        'votes:id,post_id,user_id,option_index',
        'launchVotes:id,post_id,user_id,vote',
        'likes:id',
        'reactions:id,post_id,user_id,reaction',
    ];

    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user();
        $base = Post::query()
            ->where('type', 'launch')
            ->where('is_hidden', false)
            ->whereHas('author', fn ($users) => $users->where('is_active', true))
            ->with($this->postRelations)
            ->withCount(['comments', 'likes', 'reposts']);

        $allLaunches = (clone $base)->latest()->limit(100)->get();
        $tools = $allLaunches
            ->filter(fn (Post $post) => in_array($post->launch_category, ['ai_tool', 'ai_app'], true))
            ->sortByDesc(fn (Post $post) => $post->launchVotes->sum(fn ($vote) => (int) $vote->vote))
            ->take(30)
            ->values()
            ->map(fn (Post $post) => PostPresenter::format($post, $viewer));

        $cutoff = now()->subDays(30);
        $leaders = DB::table('users as u')
            ->leftJoin('posts as p', function (JoinClause $join) use ($cutoff) {
                $join->on('p.user_id', '=', 'u.id')
                    ->where('p.is_hidden', '=', false)
                    ->where('p.created_at', '>=', $cutoff);
            })
            ->leftJoin('post_likes as pl', 'pl.post_id', '=', 'p.id')
            ->leftJoin('comments as c', 'c.post_id', '=', 'p.id')
            ->leftJoin('comments as authored_comments', function (JoinClause $join) use ($cutoff) {
                $join->on('authored_comments.user_id', '=', 'u.id')
                    ->where('authored_comments.created_at', '>=', $cutoff);
            })
            ->where('u.is_active', true)
            ->select([
                'u.id', 'u.name', 'u.username', 'u.profession', 'u.avatar_path', 'u.avatar_choice',
            ])
            ->selectRaw('COUNT(DISTINCT p.id) as posts_count')
            ->selectRaw('COUNT(DISTINCT pl.id) as likes_received')
            ->selectRaw('COUNT(DISTINCT c.id) as comments_received')
            ->selectRaw('COUNT(DISTINCT authored_comments.id) as comments_written')
            ->selectRaw('(COUNT(DISTINCT p.id) + COUNT(DISTINCT pl.id) * 2 + COUNT(DISTINCT c.id) * 3 + COUNT(DISTINCT authored_comments.id)) as engagement_score')
            ->groupBy('u.id', 'u.name', 'u.username', 'u.profession', 'u.avatar_path', 'u.avatar_choice')
            ->orderByDesc('engagement_score')
            ->orderBy('u.name')
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
