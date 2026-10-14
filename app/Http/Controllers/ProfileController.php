<?php

namespace App\Http\Controllers;

use App\Models\FriendRequest;
use App\Models\Post;
use App\Models\User;
use App\Support\AvatarLibrary;
use App\Support\CoverLibrary;
use App\Support\ImageOptimizer;
use App\Support\PostPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ProfileController extends Controller
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

    public function search(Request $request): JsonResponse
    {
        $data = $request->validate(['q' => ['nullable', 'string', 'max:80']]);
        $term = trim((string) ($data['q'] ?? ''));
        if (mb_strlen($term) < 2) return response()->json(['users' => [], 'posts' => []]);

        $pattern = '%'.$term.'%';
        $users = User::query()
            ->where('is_active', true)
            ->where(fn ($query) => $query->where('name', 'like', $pattern)->orWhere('username', 'like', $pattern))
            ->withCount(['posts' => fn ($query) => $query->where('is_hidden', false)])
            ->orderBy('name')
            ->limit(6)
            ->get()
            ->map(fn (User $user) => array_merge(PostPresenter::userSummary($user), ['postsCount' => $user->posts_count]));

        $posts = Post::query()
            ->where('is_hidden', false)
            ->where('type', '!=', 'repost')
            ->whereHas('author', fn ($author) => $author->where('is_active', true))
            ->where(fn ($query) => $query->where('title', 'like', $pattern)->orWhere('body', 'like', $pattern))
            ->with('author:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Post $post) => [
                'id' => (string) $post->id,
                'title' => $post->title ?: 'Community discussion',
                'type' => $post->type,
                'authorName' => $post->author?->name ?? 'Community member',
                'username' => $post->author?->username,
            ]);

        return response()->json(['users' => $users, 'posts' => $posts]);
    }

    public function show(Request $request, string $username): JsonResponse
    {
        $profile = User::query()->where('username', $username)->where('is_active', true)->firstOrFail();
        $viewer = $request->user();
        $posts = Post::query()
            ->where('user_id', $profile->id)
            ->where('is_hidden', false)
            ->where(fn ($query) => $query
                ->where('type', '!=', 'repost')
                ->orWhereHas('sourcePost', fn ($source) => $source->where('is_hidden', false)->whereHas('author', fn ($author) => $author->where('is_active', true))))
            ->with($this->postRelations)
            ->withCount(['comments', 'likes', 'reposts'])
            ->latest()
            ->limit(40)
            ->get();

        $friendship = $viewer && $viewer->id !== $profile->id
            ? FriendRequest::query()
                ->where('status', 'accepted')
                ->where(fn ($query) => $query
                    ->where(fn ($pair) => $pair->where('sender_id', $viewer->id)->where('recipient_id', $profile->id))
                    ->orWhere(fn ($pair) => $pair->where('sender_id', $profile->id)->where('recipient_id', $viewer->id)))
                ->first()
            : null;

        $pendingRequest = $viewer && $viewer->id !== $profile->id
            ? FriendRequest::query()
                ->where('status', 'pending')
                ->where(fn ($query) => $query
                    ->where(fn ($pair) => $pair->where('sender_id', $viewer->id)->where('recipient_id', $profile->id))
                    ->orWhere(fn ($pair) => $pair->where('sender_id', $profile->id)->where('recipient_id', $viewer->id)))
                ->first()
            : null;

        return response()->json([
            'user' => array_merge(PostPresenter::userSummary($profile), [
                'email' => $viewer && $viewer->id === $profile->id ? $profile->email : null,
                'postsCount' => $profile->posts()
                    ->where('is_hidden', false)
                    ->where(fn ($query) => $query
                        ->where('type', '!=', 'repost')
                        ->orWhereHas('sourcePost', fn ($source) => $source->where('is_hidden', false)->whereHas('author', fn ($author) => $author->where('is_active', true))))
                    ->count(),
                'followersCount' => $profile->followers()->count(),
                'followingCount' => $profile->following()->count(),
                'friendsCount' => FriendRequest::query()
                    ->where('status', 'accepted')
                    ->where(fn ($query) => $query->where('sender_id', $profile->id)->orWhere('recipient_id', $profile->id))
                    ->count(),
            ]),
            'relationship' => [
                'isSelf' => $viewer?->id === $profile->id,
                'isFollowing' => $viewer ? $viewer->following()->where('users.id', $profile->id)->exists() : false,
                'isFriend' => (bool) $friendship,
                'friendRequestId' => $pendingRequest?->id,
                'friendRequestDirection' => $pendingRequest
                    ? ($pendingRequest->sender_id === $viewer?->id ? 'outgoing' : 'incoming')
                    : null,
            ],
            'posts' => $posts->map(fn (Post $post) => PostPresenter::format($post, $viewer))->values(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'username' => [
                'required', 'string', 'min:3', 'max:24', 'regex:/^[A-Za-z0-9_]+$/',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'bio' => ['nullable', 'string', 'max:280'],
            'profession' => ['nullable', 'string', 'max:80'],
            'skills' => ['nullable', 'array', 'max:12'],
            'skills.*' => ['required', 'string', 'distinct', 'max:32'],
            'website' => ['nullable', 'url', 'max:255'],
            'avatar_choice' => ['nullable', Rule::in([...array_keys(AvatarLibrary::CHOICES), 'keep'])],
            'cover_choice' => ['nullable', Rule::in(array_keys(CoverLibrary::CHOICES))],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $user->name = $data['name'];
        $user->username = strtolower($data['username']);
        $user->bio = $data['bio'] ?? null;
        $user->profession = $data['profession'] ?? null;
        $user->skills = array_values(array_unique(array_map(
            fn (string $skill) => trim($skill),
            array_filter($data['skills'] ?? [], fn ($skill) => trim((string) $skill) !== ''),
        )));
        $user->website = $data['website'] ?? null;
        if (array_key_exists('cover_choice', $data)) {
            $user->cover_choice = CoverLibrary::valid($data['cover_choice']);
        }

        $avatarChoice = $data['avatar_choice'] ?? null;
        if ($request->hasFile('avatar')) {
            try {
                $avatarPath = ImageOptimizer::store($request->file('avatar'), 'avatars', 512, 82);
            } catch (RuntimeException $error) {
                throw ValidationException::withMessages(['avatar' => [$error->getMessage()]]);
            }
            if ($user->avatar_path) Storage::disk('public')->delete($user->avatar_path);
            $user->avatar_path = $avatarPath;
            if ($avatarChoice && $avatarChoice !== 'keep') $user->avatar_choice = $avatarChoice;
        } elseif ($avatarChoice && $avatarChoice !== 'keep') {
            if ($user->avatar_path) Storage::disk('public')->delete($user->avatar_path);
            $user->avatar_path = null;
            $user->avatar_choice = $avatarChoice;
        }

        $user->save();

        return response()->json(['user' => PostPresenter::userSummary($user->fresh())]);
    }

    public function toggleFollow(Request $request, User $user): JsonResponse
    {
        abort_if($user->id === $request->user()->id || ! $user->is_active, 404);
        $relation = $request->user()->following();
        $isFollowing = $relation->where('users.id', $user->id)->exists();

        if ($isFollowing) {
            $relation->detach($user->id);
            $isFollowing = false;
        } else {
            $relation->attach($user->id);
            $isFollowing = true;
        }

        return response()->json([
            'isFollowing' => $isFollowing,
            'followersCount' => $user->followers()->count(),
        ]);
    }

    public function sendFriendRequest(Request $request, User $user): JsonResponse
    {
        abort_if($user->id === $request->user()->id || ! $user->is_active, 404);

        $existing = FriendRequest::query()
            ->where(fn ($query) => $query
                ->where(fn ($pair) => $pair->where('sender_id', $request->user()->id)->where('recipient_id', $user->id))
                ->orWhere(fn ($pair) => $pair->where('sender_id', $user->id)->where('recipient_id', $request->user()->id)))
            ->whereIn('status', ['pending', 'accepted'])
            ->first();

        if ($existing?->status === 'accepted') {
            return response()->json(['status' => 'accepted', 'friendRequestId' => $existing->id]);
        }

        if ($existing) {
            return response()->json([
                'status' => 'pending',
                'direction' => $existing->sender_id === $request->user()->id ? 'outgoing' : 'incoming',
                'friendRequestId' => $existing->id,
            ]);
        }

        $friendRequest = FriendRequest::updateOrCreate(
            ['sender_id' => $request->user()->id, 'recipient_id' => $user->id],
            ['status' => 'pending', 'responded_at' => null],
        );

        return response()->json([
            'status' => 'pending',
            'direction' => 'outgoing',
            'friendRequestId' => $friendRequest->id,
        ], 201);
    }

    public function friendRequests(Request $request): JsonResponse
    {
        $requests = FriendRequest::query()
            ->with('sender:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,is_admin')
            ->where('recipient_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn (FriendRequest $friendRequest) => [
                'id' => $friendRequest->id,
                'user' => PostPresenter::userSummary($friendRequest->sender),
                'createdAt' => $friendRequest->created_at->diffForHumans(),
            ]);

        return response()->json(['data' => $requests]);
    }

    public function respondFriendRequest(Request $request, FriendRequest $friendRequest): JsonResponse
    {
        abort_unless($friendRequest->recipient_id === $request->user()->id && $friendRequest->status === 'pending', 404);
        $data = $request->validate(['response' => ['required', 'in:accept,decline']]);

        $friendRequest->status = $data['response'] === 'accept' ? 'accepted' : 'declined';
        $friendRequest->responded_at = now();
        $friendRequest->save();

        return response()->json(['status' => $friendRequest->status]);
    }

    public function removeFriend(Request $request, User $user): JsonResponse
    {
        $ids = [$request->user()->id, $user->id];
        FriendRequest::query()
            ->where('status', 'accepted')
            ->where(fn ($query) => $query
                ->where(fn ($pair) => $pair->where('sender_id', $ids[0])->where('recipient_id', $ids[1]))
                ->orWhere(fn ($pair) => $pair->where('sender_id', $ids[1])->where('recipient_id', $ids[0])))
            ->delete();

        return response()->json(['status' => 'removed']);
    }
}
