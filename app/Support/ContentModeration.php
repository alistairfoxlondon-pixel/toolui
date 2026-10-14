<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class ContentModeration
{
    public static function check(string $text, string $field = 'body'): void
    {
        if (class_exists(\Normalizer::class)) $text = \Normalizer::normalize($text, \Normalizer::FORM_KC) ?: $text;
        $text = mb_convert_kana($text, 'as', 'UTF-8');
        $text = mb_strtolower(preg_replace('/\p{Cf}/u', '', $text));
        $text = strtr($text, ['0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't', '@' => 'a', '$' => 's']);
        $text = trim(preg_replace('/[^\p{L}\p{M}\p{N}]+/u', ' ', $text));
        static $rules;
        $rules ??= json_decode(file_get_contents(resource_path('data/moderation-rules.json')), true, 512, JSON_THROW_ON_ERROR);
        foreach ($rules['patterns'] as $pattern) {
            if (preg_match('~(?:^|[^\p{L}\p{M}\p{N}])(?:'.$pattern.')(?![\p{L}\p{M}\p{N}])~iu', $text)) {
                throw ValidationException::withMessages([$field => 'Not sent: this text matches a hate, threat, or abuse safety rule. Please edit it.']);
            }
        }
    }
}
