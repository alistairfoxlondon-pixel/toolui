<?php

namespace App\Support;

use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class PostPresenter
{
    /**
     * Load only the viewer's like membership, not every liker as a User model.
     * Counts stay database aggregates; original/reposted content gets the same
     * counts in a batched eager load instead of lazy queries per source post.
     */
    public static function relations(?User $viewer): array
    {
        $relations = [
            'author:id,name,username,bio,profession,skills,website,avatar_path,avatar_choice,cover_choice,is_admin',
            'votes:id,post_id,user_id,option_index',
            'launchVotes:id,post_id,user_id,vote',
            'likes' => fn ($query) => $query->select('users.id')->whereKey($viewer?->id ?? 0),
            'reactions:id,post_id,user_id,reaction',
        ];

        return array_merge($relations, [
            'sourcePost' => fn ($query) => $query->with($relations)->withCount(['comments', 'likes', 'reposts']),
        ]);
    }

    public static function format(Post $post, ?User $viewer, bool $includeSource = true): array
    {
        $options = $post->options ?? [];
        $voteCounts = array_fill(0, count($options), 0);
        $myVote = null;

        foreach ($post->votes as $vote) {
            if (array_key_exists((int) $vote->option_index, $voteCounts)) {
                $voteCounts[(int) $vote->option_index]++;
            }
            if ($viewer && (int) $vote->user_id === (int) $viewer->id) {
                $myVote = (int) $vote->option_index;
            }
        }

        $reactionCounts = ['celebrate' => 0, 'helpful' => 0, 'support' => 0];
        $myReaction = null;
        foreach ($post->reactions as $reaction) {
            if (array_key_exists($reaction->reaction, $reactionCounts)) {
                $reactionCounts[$reaction->reaction]++;
            }
            if ($viewer && (int) $reaction->user_id === (int) $viewer->id) {
                $myReaction = $reaction->reaction;
            }
        }

        $upvotes = 0;
        $downvotes = 0;
        $myLaunchVote = null;
        foreach ($post->launchVotes as $launchVote) {
            if ((int) $launchVote->vote === 1) {
                $upvotes++;
            } elseif ((int) $launchVote->vote === -1) {
                $downvotes++;
            }
            if ($viewer && (int) $launchVote->user_id === (int) $viewer->id) {
                $myLaunchVote = (int) $launchVote->vote;
            }
        }

        $author = $post->author;
        $source = $includeSource && $post->type === 'repost' && $post->sourcePost
            ? self::format($post->sourcePost, $viewer, false)
            : null;

        return [
            'id' => (string) $post->id,
            'type' => $post->type,
            'title' => $post->title,
            'seoDescription' => $post->seo_description,
            'body' => $post->body,
            'category' => $post->category,
            'launchCategory' => $post->launch_category,
            'modelProvider' => $post->model_provider,
            'modelAccess' => $post->model_access,
            'projectUrl' => $post->project_url,
            'imageUrl' => $post->image_path ? Storage::disk('public')->url($post->image_path) : null,
            'logoUrl' => $post->logo_path ? Storage::disk('public')->url($post->logo_path) : null,
            'options' => $options,
            'votes' => $voteCounts,
            'votedOption' => $myVote,
            'authorName' => $author?->name ?? 'Community member',
            'author' => $author ? self::userSummary($author) : null,
            'createdAt' => $post->created_at?->diffForHumans() ?? 'just now',
            'likes' => (int) ($post->likes_count ?? ($post->relationLoaded('likes') ? $post->likes->count() : 0)),
            'liked' => $viewer ? ($post->relationLoaded('likes')
                ? $post->likes->contains('id', $viewer->id)
                : $post->likes()->whereKey($viewer->id)->exists()) : false,
            'reactions' => $reactionCounts,
            'myReaction' => $myReaction,
            'commentsCount' => (int) ($post->comments_count ?? 0),
            'repostsCount' => (int) ($post->reposts_count ?? 0),
            'upvotes' => $upvotes,
            'downvotes' => $downvotes,
            'launchVote' => $myLaunchVote,
            'sourcePost' => $source,
            'isHidden' => (bool) $post->is_hidden,
            'isFeatured' => (bool) $post->is_featured,
        ];
    }

    public static function userSummary(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'bio' => $user->bio,
            'profession' => $user->profession,
            'skills' => $user->skills ?? [],
            'website' => $user->website,
            'avatarChoice' => $user->avatar_choice ?: 'neutral',
            'coverChoice' => CoverLibrary::valid($user->cover_choice),
            'avatarUploaded' => (bool) $user->avatar_path,
            'avatarUrl' => $user->avatar_path
                ? Storage::disk('public')->url($user->avatar_path)
                : AvatarLibrary::url($user->avatar_choice),
            'isAdmin' => (bool) $user->is_admin,
        ];
    }
}
