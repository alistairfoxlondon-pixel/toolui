<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Brand extends Model
{
    protected $fillable = ['slug', 'user_id', 'post_id'];

    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function post(): BelongsTo { return $this->belongsTo(Post::class); }
}
