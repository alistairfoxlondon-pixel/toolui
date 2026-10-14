<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\PostReaction;
use App\Models\PostReport;
use App\Models\PostVote;
use App\Support\ImageOptimizer;
use App\Support\PostPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class PostController extends Controller
{
    private array $postRelations = [
        'author:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin',
        'votes:id,post_id,user_id,option_index',
        'launchVotes:id,post_id,user_id,vote',
        'likes:id',
        'reactions:id,post_id,user_id,reaction',
        'sourcePost.author:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin',
        'sourcePost.votes:id,post_id,user_id,option_index',
        'sourcePost.launchVotes:id,post_id,user_id,vote',
        'sourcePost.likes:id',
        'sourcePost.reactions:id,post_id,user_id,reaction',
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Post::query()
            ->where('is_hidden', false)
            ->whereHas('author', fn ($author) => $author->where('is_active', true))
            ->where(function ($query) {
                $query->where('type', '!=', 'repost')
                    ->orWhereHas('sourcePost', fn ($source) => $source->where('is_hidden', false)->whereHas('author', fn ($author) => $author->where('is_active', true)));
            })
            ->with($this->postRelations)
            ->withCount(['comments', 'likes', 'reposts']);

        $type = $request->query('type');
        if (in_array($type, ['discussion', 'question', 'poll', 'launch', 'model', 'repost'], true)) {
            $query->where('type', $type);
        }

        $posts = $query->latest()->limit(60)->get();

        return response()->json([
            'data' => $posts->map(fn (Post $post) => PostPresenter::format($post, $request->user()))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $type = $request->input('type');

        $data = $request->validate([
            'type' => ['required', 'in:discussion,question,poll,launch,model'],
            'title' => in_array($type, ['question', 'poll', 'launch', 'model'], true)
                ? ['required', 'string', 'max:140']
                : ['nullable', 'string', 'max:140'],
            'body' => in_array($type, ['discussion', 'question', 'launch', 'model'], true)
                ? ['required', 'string', 'max:5000']
                : ['nullable', 'string', 'max:5000'],
            'category' => ['nullable', 'string', 'max:48'],
            'launch_category' => ['nullable', 'in:ai_tool,ai_app,app,website,other'],
            'model_provider' => $type === 'model' ? ['nullable', 'string', 'max:60'] : ['prohibited'],
            'model_access' => $type === 'model'
                ? ['nullable', 'in:free,freemium,paid']
                : ['prohibited'],
            'project_url' => $type === 'launch'
                ? ['required', 'url', 'max:2048']
                : ['nullable', 'url', 'max:2048'],
            'options' => $type === 'poll'
                ? ['required', 'array', 'min:2', 'max:8']
                : ['nullable', 'array', 'max:8'],
            'options.*' => ['required', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'logo' => ['nullable', 'file', 'mimes:svg,jpg,jpeg,png,webp', 'max:2048'],
        ]);

        try {
            $imagePath = $request->hasFile('image')
                ? ImageOptimizer::store($request->file('image'), 'posts', 1600, 82)
                : null;
            $logoPath = $request->hasFile('logo')
                ? ImageOptimizer::store($request->file('logo'), 'launch-logos', 512, 84, true)
                : null;
        } catch (RuntimeException $error) {
            $field = $request->hasFile('logo') ? 'logo' : 'image';
            throw ValidationException::withMessages([$field => [$error->getMessage()]]);
        }

        $post = Post::create([
            'user_id' => $request->user()->id,
            'type' => $data['type'],
            'title' => $data['title'] ?? null,
            'body' => $data['body'] ?? null,
            'category' => $data['type'] === 'model' ? ($data['category'] ?? 'AI models') : ($data['category'] ?? null),
            'launch_category' => $data['type'] === 'launch' ? ($data['launch_category'] ?? 'other') : null,
            'model_provider' => $data['type'] === 'model' ? ($data['model_provider'] ?? null) : null,
            'model_access' => $data['type'] === 'model' ? ($data['model_access'] ?? 'free') : null,
            'project_url' => in_array($data['type'], ['launch', 'model'], true) ? ($data['project_url'] ?? null) : null,
            'image_path' => $imagePath,
            'logo_path' => $logoPath,
            'options' => $data['type'] === 'poll' ? array_values($data['options']) : null,
        ]);

        $post->load($this->postRelations)->loadCount(['comments', 'likes', 'reposts']);

        return response()->json([
            'post' => PostPresenter::format($post, $request->user()),
        ], 201);
    }

    public function vote(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        abort_unless($post->type === 'poll' && is_array($post->options), 404);

        $data = $request->validate([
            'option_index' => ['required', 'integer', 'min:0', 'max:'.max(0, count($post->options) - 1)],
        ]);

        PostVote::updateOrCreate(
            ['post_id' => $post->id, 'user_id' => $request->user()->id],
            ['option_index' => (int) $data['option_index']],
        );
        $post->load('votes:id,post_id,user_id,option_index');

        $counts = array_fill(0, count($post->options), 0);
        foreach ($post->votes as $vote) {
            if (array_key_exists((int) $vote->option_index, $counts)) {
                $counts[(int) $vote->option_index]++;
            }
        }

        return response()->json(['votes' => $counts, 'votedOption' => (int) $data['option_index']]);
    }

    public function voteLaunch(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        abort_unless($post->type === 'launch', 404);
        $data = $request->validate(['vote' => ['required', 'integer', 'in:-1,1']]);
        $value = (int) $data['vote'];
        $existing = $post->launchVotes()->where('user_id', $request->user()->id)->first();

        if ($existing && (int) $existing->vote === $value) {
            $existing->delete();
            $selected = null;
        } else {
            $post->launchVotes()->updateOrCreate(
                ['user_id' => $request->user()->id],
                ['vote' => $value],
            );
            $selected = $value;
        }

        return response()->json([
            'upvotes' => $post->launchVotes()->where('vote', 1)->count(),
            'downvotes' => $post->launchVotes()->where('vote', -1)->count(),
            'launchVote' => $selected,
        ]);
    }

    public function toggleLike(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        $like = PostLike::query()->where('post_id', $post->id)->where('user_id', $request->user()->id)->first();

        if ($like) {
            $like->delete();
            $liked = false;
        } else {
            PostLike::create(['post_id' => $post->id, 'user_id' => $request->user()->id]);
            $liked = true;
        }

        return response()->json(['liked' => $liked, 'likes' => $post->likes()->count()]);
    }

    public function react(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        $data = $request->validate([
            'reaction' => ['required', 'in:celebrate,helpful,support'],
        ]);

        $reaction = PostReaction::query()->where('post_id', $post->id)->where('user_id', $request->user()->id)->first();
        if ($reaction?->reaction === $data['reaction']) {
            $reaction->delete();
            $selected = null;
        } else {
            PostReaction::updateOrCreate(
                ['post_id' => $post->id, 'user_id' => $request->user()->id],
                ['reaction' => $data['reaction']],
            );
            $selected = $data['reaction'];
        }

        $counts = $post->reactions()->selectRaw('reaction, COUNT(*) as total')->groupBy('reaction')->pluck('total', 'reaction');

        return response()->json([
            'myReaction' => $selected,
            'reactions' => [
                'celebrate' => (int) ($counts['celebrate'] ?? 0),
                'helpful' => (int) ($counts['helpful'] ?? 0),
                'support' => (int) ($counts['support'] ?? 0),
            ],
        ]);
    }

    public function comment(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:2000']]);

        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);
        $comment->load('author:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin');

        return response()->json([
            'comment' => [
                'id' => $comment->id,
                'body' => $comment->body,
                'authorName' => $comment->author->name,
                'username' => $comment->author->username,
                'avatarUrl' => PostPresenter::userSummary($comment->author)['avatarUrl'],
                'createdAt' => $comment->created_at->diffForHumans(),
            ],
            'comments' => $post->comments()->count(),
        ], 201);
    }

    public function report(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        abort_if((int) $post->user_id === (int) $request->user()->id, 404);
        $data = $request->validate([
            'reason' => ['required', 'in:spam,harassment,misinformation,unsafe,other'],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        PostReport::updateOrCreate(
            ['post_id' => $post->id, 'reporter_id' => $request->user()->id],
            ['reason' => $data['reason'], 'details' => $data['details'] ?? null, 'status' => 'open'],
        );

        return response()->json(['ok' => true, 'message' => 'Thank you. The report is in the moderation queue.'], 201);
    }

    public function repost(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        $data = $request->validate(['body' => ['nullable', 'string', 'max:2000']]);
        $original = $post->type === 'repost' ? $post->sourcePost : $post;
        abort_if(! $original, 404);
        $this->ensureAvailable($original);

        $repost = Post::create([
            'user_id' => $request->user()->id,
            'type' => 'repost',
            'source_post_id' => $original->id,
            'body' => $data['body'] ?? null,
        ]);
        $repost->load($this->postRelations)->loadCount(['comments', 'likes', 'reposts']);

        return response()->json(['post' => PostPresenter::format($repost, $request->user())], 201);
    }
    private function ensureAvailable(Post $post): void
    {
        abort_if($post->is_hidden || ! $post->author()->where('is_active', true)->exists(), 404);
    }

}
