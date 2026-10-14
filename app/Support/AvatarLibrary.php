<?php

namespace App\Support;

final class AvatarLibrary
{
    public const CHOICES = [
        'fluent-man-classic' => 'Male — Classic',
        'fluent-man-curly' => 'Male — Curly',
        'fluent-man-copper' => 'Male — Copper',
        'fluent-man-coder' => 'Male — Coder',
        'fluent-man-artist' => 'Male — Artist',
        'fluent-man-explorer' => 'Male — Explorer',
        'fluent-woman-classic' => 'Female — Classic',
        'fluent-woman-curly' => 'Female — Curly',
        'fluent-woman-copper' => 'Female — Copper',
        'fluent-woman-coder' => 'Female — Coder',
        'fluent-woman-artist' => 'Female — Artist',
        'fluent-woman-explorer' => 'Female — Explorer',

        'fluent-robot' => 'Robot',
        'fluent-astronaut' => 'Astronaut',
        'fluent-ninja' => 'Ninja',
        'fluent-fox' => 'Fox',
        'fluent-cat-face' => 'Cat face',
        'fluent-unicorn' => 'Unicorn',
        'fluent-alien' => 'Alien',
        'fluent-ghost' => 'Ghost',
        'fluent-dragon-face' => 'Dragon face',
        'fluent-panda' => 'Panda',
        'fluent-owl' => 'Owl',
        'fluent-octopus' => 'Octopus',

        'orbit-ollie' => 'Orbit Ollie',
        'captain-commit' => 'Captain Commit',
        'byte-bard' => 'Byte Bard',
        'agent-loop' => 'Agent Loop',
        'professor-patch' => 'Professor Patch',
        'noodle-ninja' => 'Noodle Ninja',
        'nova-nomad' => 'Nova Nomad',
        'pixel-fox' => 'Pixel Fox',
        'dino-debug' => 'Dino Debug',
        'sir-ships' => 'Sir Ships-a-lot',
        'bean-bandit' => 'Bean Bandit',
        'bug-buddy' => 'Bug Buddy',
        'robo-ravi' => 'Robo Ravi',
        'disco-duck' => 'Disco Duck',
        'cloud-kid' => 'Cloud Kid',
        'spook-exe' => 'Spook.exe',
        'midnight-moth' => 'Midnight Moth',
        'ramen-ronin' => 'Ramen Ronin',
        'cosmic-cat' => 'Cosmic Cat',
        'moss-mage' => 'Moss Mage',
        'sheriff-syntax' => 'Sheriff Syntax',
        'neon-gecko' => 'Neon Gecko',
        'count-cache' => 'Count Cache',
        'toast-rider' => 'Toast Rider',
        'neutral' => 'Neutral',
        'female-rose' => 'Woman in rose',
        'female-violet' => 'Woman in violet',
        'female-teal' => 'Woman in teal',
        'female-sun' => 'Woman with blonde bun',
        'female-forest' => 'Woman with curly hair',
        'female-ocean' => 'Woman in navy',
        'female-dusk' => 'Woman with silver bob',
        'male-indigo' => 'Man in indigo',
        'male-sky' => 'Man in sky blue',
        'male-amber' => 'Man in amber',
        'male-forest' => 'Man in forest green',
        'male-ruby' => 'Man in ruby',
        'male-slate' => 'Man in slate',
        'male-wine' => 'Man in wine',
    ];

    public static function url(?string $choice): string
    {
        $key = array_key_exists((string) $choice, self::CHOICES) ? $choice : 'robo-ravi';

        // Map retired portrait identifiers to the current illustrated avatar library.
        static $aliases;
        $aliases ??= json_decode(file_get_contents(resource_path('data/avatar-aliases.json')), true, flags: JSON_THROW_ON_ERROR);
        $key = $aliases[$key] ?? $key;

        static $assets;
        $assets ??= json_decode(file_get_contents(resource_path('data/avatar-assets.json')), true, flags: JSON_THROW_ON_ERROR);

        return asset(ltrim(($assets[$key] ?? $assets['robo-ravi'])['small'], '/'));
    }
}
