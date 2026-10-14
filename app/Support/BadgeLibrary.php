<?php

namespace App\Support;

use App\Models\User;

final class BadgeLibrary
{
    public const ADMIN = ['community-star' => 'Community star', 'expert' => 'Expert', 'early-supporter' => 'Early supporter'];

    // Derived from current, visible activity: deleted/hidden content cannot farm badges.
    public static function forUser(User $user): array
    {
        $counts = $user->posts()->where('is_hidden', false)
            ->whereIn('type', ['discussion', 'question', 'poll', 'launch'])
            ->selectRaw('type, count(*) as total')->groupBy('type')->pluck('total', 'type');
        $badges = [];
        if ($counts->sum() >= 1) $badges[] = ['key' => 'first-step', 'label' => 'First step', 'source' => 'activity'];
        if ($counts->sum() >= 10) $badges[] = ['key' => 'regular', 'label' => 'Dock regular', 'source' => 'activity'];
        if (($counts['launch'] ?? 0) >= 1) $badges[] = ['key' => 'maker', 'label' => 'Launched it', 'source' => 'activity'];
        if (($counts['poll'] ?? 0) >= 3) $badges[] = ['key' => 'curious', 'label' => 'Curious mind', 'source' => 'activity'];
        if ($user->comments()->whereHas('post', fn ($q) => $q->where('is_hidden', false)->whereIn('type', ['discussion', 'question', 'poll', 'launch'])->whereHas('author', fn ($a) => $a->where('is_active', true)))->count() >= 10) {
            $badges[] = ['key' => 'contributor', 'label' => 'Conversation starter', 'source' => 'activity'];
        }
        foreach ($user->memberBadges as $award) {
            if (isset(self::ADMIN[$award->badge])) $badges[] = ['key' => $award->badge, 'label' => self::ADMIN[$award->badge], 'source' => 'admin'];
        }
        return $badges;
    }
}
