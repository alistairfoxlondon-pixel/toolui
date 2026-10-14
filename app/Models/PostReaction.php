<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostReaction extends Model
{
    protected $fillable = ['post_id', 'user_id', 'reaction'];

    public static function types(): array
    {
        static $types;
        return $types ??= array_column(json_decode(file_get_contents(resource_path('data/reactions.json')), true, flags: JSON_THROW_ON_ERROR), 'key');
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
