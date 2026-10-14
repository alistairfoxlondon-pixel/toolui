<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBlock extends Model
{
    protected $fillable = ['blocker_id', 'blocked_id'];

    public static function between(int $first, int $second): bool
    {
        return self::where(fn ($q) => $q->where('blocker_id', $first)->where('blocked_id', $second))
            ->orWhere(fn ($q) => $q->where('blocker_id', $second)->where('blocked_id', $first))->exists();
    }

    public static function excludedIds(int $viewer): array
    {
        return self::where('blocker_id', $viewer)->orWhere('blocked_id', $viewer)->get()
            ->map(fn ($block) => (int) $block->blocker_id === $viewer ? (int) $block->blocked_id : (int) $block->blocker_id)->unique()->values()->all();
    }
}
