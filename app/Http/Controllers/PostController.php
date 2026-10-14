<?php

namespace App\Http\Controllers;

use App\Support\ContentModeration;

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
    public function index(Request $request): JsonResponse
    {
        $query = Post::query()
            ->where('type', '!=', 'model')->where('is_hidden', false)
            ->whereHas('author', fn ($author) => $author->where('is_active', true))
            ->where(function ($query) {
                $query->where('type', '!=', 'repost')
                    ->orWhereHas('sourcePost', fn ($source) => $source->where('type', '!=', 'model')->where('is_hidden', false)->whereHas('author', fn ($author) => $author->where('is_active', true)));
            })
            ->with(PostPresenter::relations($request->user()))
            ->withCount(['comments', 'likes', 'reposts']);

        $type = $request->query('type');
        if (in_array($type, ['discussion', 'question', 'poll', 'launch', 'repost'], true)) {
            $query->where('type', $type);
        }

        $posts = $query->latest()->limit(60)->get();

        return response()->json([
            'data' => $posts->map(fn (Post $post) => PostPresenter::format($post, $request->user()))->values(),
        ]);
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        if ($post->type === 'repost') {
            abort_unless($post->sourcePost, 404);
            $this->ensureAvailable($post->sourcePost);
        }
        $post->load(PostPresenter::relations($request->user()))->loadCount(['comments', 'likes', 'reposts']);

        return response()->json(['post' => PostPresenter::format($post, $request->user())]);
    }

    public function store(Request $request): JsonResponse
    {
        $type = $request->input('type');

        $data = $request->validate([
            'type' => ['required', 'in:discussion,question,poll,launch'],
            'title' => in_array($type, ['question', 'poll', 'launch'], true)
                ? ['required', 'string', 'max:140']
                : ['nullable', 'string', 'max:140'],
            'body' => in_array($type, ['discussion', 'question', 'launch'], true)
                ? ['required', 'string', 'max:5000']
                : ['nullable', 'string', 'max:5000'],
            'category' => ['nullable', 'string', 'max:48'],
            'launch_category' => ['nullable', 'in:ai_tool,ai_app,app,website,other'],
            'model_provider' => ['prohibited'],
            'model_access' => ['prohibited'],
            'seo_description' => $type === 'launch' ? ['nullable', 'string', 'max:160'] : ['prohibited'],
            'project_url' => $type === 'launch'
                ? ['required', 'url:http,https', 'max:2048']
                : ['nullable', 'url:http,https', 'max:2048'],
            'options' => $type === 'poll'
                ? ['required', 'array', 'min:2', 'max:8']
                : ['nullable', 'array', 'max:8'],
            'options.*' => ['required', 'string', 'distinct:ignore_case', 'max:80'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'brand_slug' => ['nullable', 'prohibited_unless:type,launch', 'string', 'min:3', 'max:40', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:brands,slug'],
            'brand_authorized' => ['exclude_without:brand_slug', 'required', 'accepted'],
            'logo' => ['nullable', 'file', 'mimes:svg,jpg,jpeg,png,webp', 'max:2048'],
        ]);

        ContentModeration::check(implode(' ', [$data['title'] ?? '', $data['body'] ?? '', $data['seo_description'] ?? '', ...($data['options'] ?? [])]));
        $imagePath = null;
        try {
            $imagePath = $request->hasFile('image')
                ? ImageOptimizer::store($request->file('image'), 'posts', 1600, 82)
                : null;
            $logoPath = $request->hasFile('logo')
                ? ImageOptimizer::store($request->file('logo'), 'launch-logos', 512, 84, true)
                : null;
        } catch (RuntimeException $error) {
            if ($imagePath) \Illuminate\Support\Facades\Storage::disk('public')->delete($imagePath);
            $field = $request->hasFile('logo') ? 'logo' : 'image';
            throw ValidationException::withMessages([$field => [$error->getMessage()]]);
        }

        try {
            $post = \Illuminate\Support\Facades\DB::transaction(function () use ($request, $data, $imagePath, $logoPath) {
                $post = Post::create([
                    'user_id' => $request->user()->id,
                    'type' => $data['type'],
                    'title' => $data['title'] ?? null,
                    'seo_description' => $data['seo_description'] ?? null,
                    'body' => $data['body'] ?? null,
                    'category' => $data['category'] ?? null,
                    'launch_category' => $data['type'] === 'launch' ? ($data['launch_category'] ?? 'other') : null,
                    'project_url' => $data['type'] === 'launch' ? ($data['project_url'] ?? null) : null,
                    'image_path' => $imagePath,
                    'logo_path' => $logoPath,
                    'options' => $data['type'] === 'poll' ? array_values($data['options']) : null,
                ]);

                if ($data['type'] === 'launch' && !empty($data['brand_slug'])) {
                    $post->brand()->create(['slug' => $data['brand_slug'], 'user_id' => $request->user()->id]);
                }
                return $post;
            });
        } catch (\Throwable $error) {
            foreach ([$imagePath, $logoPath] as $path) {
                if ($path) \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
            }
            if ($error instanceof \Illuminate\Database\UniqueConstraintViolationException) {
                throw ValidationException::withMessages(['brand_slug' => 'That brand handle has just been claimed. Choose another.']);
            }
            throw $error;
        }

        $post->load(PostPresenter::relations($request->user()))->loadCount(['comments', 'likes', 'reposts']);

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
            'reaction' => ['required', \Illuminate\Validation\Rule::in(PostReaction::types())],
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $post, $data) {
            // Serialize changes on this post so switching/toggling cannot create duplicates.
            Post::whereKey($post->id)->lockForUpdate()->firstOrFail();
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
            $totals = array_fill_keys(PostReaction::types(), 0);
            foreach ($totals as $key => $_) $totals[$key] = (int) ($counts[$key] ?? 0);
            return response()->json(['myReaction' => $selected, 'reactions' => $totals]);
        });
    }

    public function comment(Request $request, Post $post): JsonResponse
    {
        $this->ensureAvailable($post);
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:2000']]);

        ContentModeration::check($data['body']);
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

        ContentModeration::check($data['body'] ?? '');
        $repost = Post::create([
            'user_id' => $request->user()->id,
            'type' => 'repost',
            'source_post_id' => $original->id,
            'body' => $data['body'] ?? null,
        ]);
        $repost->load(PostPresenter::relations($request->user()))->loadCount(['comments', 'likes', 'reposts']);

        return response()->json(['post' => PostPresenter::format($repost, $request->user())], 201);
    }
    private function ensureAvailable(Post $post): void
    {
        abort_if($post->type === 'model' || $post->is_hidden || ! $post->author()->where('is_active', true)->exists(), 404);
    }

}
