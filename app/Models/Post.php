<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title', 'seo_description',
        'body',
        'category',
        'launch_category',
        'model_provider',
        'model_access',
        'project_url',
        'image_path',
        'logo_path',
        'source_post_id',
        'options',
        'is_hidden',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'is_hidden' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function brand(): HasOne
    {
        return $this->hasOne(Brand::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function sourcePost(): BelongsTo
    {
        return $this->belongsTo(self::class, 'source_post_id');
    }

    public function reposts(): HasMany
    {
        return $this->hasMany(self::class, 'source_post_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PostVote::class);
    }

    public function launchVotes(): HasMany
    {
        return $this->hasMany(LaunchVote::class);
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(PostReaction::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(PostReport::class);
    }

    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_likes')->withTimestamps();
    }
}
