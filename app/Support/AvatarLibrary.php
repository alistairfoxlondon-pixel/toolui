<?php

namespace App\Support;

final class AvatarLibrary
{
    public const CHOICES = [
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
        $key = array_key_exists((string) $choice, self::CHOICES) ? $choice : 'neutral';

        return asset('avatars/'.$key.'.svg');
    }
}
