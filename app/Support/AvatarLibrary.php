<?php

namespace App\Support;

final class AvatarLibrary
{
    public const CHOICES = [
        'neutral' => 'Neutral',
        'female-rose' => 'Woman in rose',
        'female-violet' => 'Woman in violet',
        'female-teal' => 'Woman in teal',
        'male-indigo' => 'Man in indigo',
        'male-sky' => 'Man in sky',
        'male-amber' => 'Man in amber',
    ];

    public static function url(?string $choice): string
    {
        $key = array_key_exists((string) $choice, self::CHOICES) ? $choice : 'neutral';

        return asset('avatars/'.$key.'.svg');
    }
}
