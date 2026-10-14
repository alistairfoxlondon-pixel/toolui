<?php

namespace App\Support;

final class CoverLibrary
{
    public const CHOICES = [
        'aurora' => 'Aurora',
        'blossom' => 'Blossom',
        'sunset' => 'Sunset',
        'ocean' => 'Ocean',
        'forest' => 'Forest',
        'grape' => 'Grape',
        'peach' => 'Peach',
        'slate' => 'Slate',
    ];

    public const DEFAULT = 'aurora';

    public static function valid(?string $choice): string
    {
        return array_key_exists((string) $choice, self::CHOICES) ? (string) $choice : self::DEFAULT;
    }
}
