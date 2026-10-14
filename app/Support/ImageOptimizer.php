<?php

namespace App\Support;

use DOMDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

final class ImageOptimizer
{
    public static function store(UploadedFile $file, string $directory, int $maxDimension = 1600, int $quality = 82, bool $allowSvg = false): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $mime = strtolower((string) $file->getMimeType());
        if ($extension === 'svg' || str_contains($mime, 'svg')) {
            if (! $allowSvg) {
                throw new RuntimeException('SVG files are only accepted for project logos.');
            }

            return self::storeSvg($file, $directory);
        }

        $contents = $file->getContent();
        $details = @getimagesizefromstring($contents);
        if (! $details || empty($details[0]) || empty($details[1]) || $details[0] * $details[1] > 24000000) {
            throw new RuntimeException('This image could not be safely processed. Choose a smaller image.');
        }

        if (! function_exists('imagecreatefromstring')) {
            return self::storeOriginal($file, $directory);
        }

        $source = @imagecreatefromstring($contents);
        if (! $source) {
            throw new RuntimeException('This image could not be opened. Choose another file.');
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $scale = min(1, $maxDimension / max($width, $height));
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));
        $target = imagecreatetruecolor($targetWidth, $targetHeight);
        if (! $target) {
            imagedestroy($source);
            throw new RuntimeException('This image could not be resized. Choose another file.');
        }

        imagealphablending($target, false);
        imagesavealpha($target, true);
        $transparent = imagecolorallocatealpha($target, 255, 255, 255, 127);
        imagefill($target, 0, 0, $transparent);
        imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        $outputExtension = 'jpg';
        $written = false;
        if (function_exists('imagewebp')) {
            $written = imagewebp($target, null, max(55, min(92, $quality)));
            $outputExtension = 'webp';
        } elseif ($details[2] === IMAGETYPE_PNG && function_exists('imagepng')) {
            $written = imagepng($target, null, 6);
            $outputExtension = 'png';
        } elseif (function_exists('imagejpeg')) {
            $written = imagejpeg($target, null, max(55, min(92, $quality)));
        }
        $optimized = ob_get_clean();
        imagedestroy($target);
        imagedestroy($source);

        if (! $written || ! is_string($optimized) || $optimized === '') {
            return self::storeOriginal($file, $directory);
        }

        $path = trim($directory, '/').'/'.Str::uuid().'.'.$outputExtension;
        Storage::disk('public')->put($path, $optimized);

        return $path;
    }

    private static function storeSvg(UploadedFile $file, string $directory): string
    {
        if (! class_exists(DOMDocument::class)) {
            throw new RuntimeException('SVG logo support needs the PHP DOM extension.');
        }

        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $loaded = $document->loadXML($file->getContent(), LIBXML_NONET | LIBXML_NOBLANKS | LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded || strtolower($document->documentElement?->localName ?? '') !== 'svg') {
            throw new RuntimeException('Choose a valid SVG file.');
        }

        $remove = [];
        foreach ($document->getElementsByTagName('*') as $element) {
            $tag = strtolower($element->localName);
            if (in_array($tag, ['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'style'], true)) {
                $remove[] = $element;
                continue;
            }

            $attributes = [];
            foreach ($element->attributes as $attribute) {
                $attributes[] = [$attribute->name, $attribute->value];
            }
            foreach ($attributes as [$name, $value]) {
                $name = strtolower($name);
                $value = trim($value);
                if (str_starts_with($name, 'on')) {
                    $element->removeAttribute($name);
                    continue;
                }
                if (in_array($name, ['href', 'xlink:href', 'src'], true)
                    && $value !== ''
                    && ! str_starts_with($value, '#')
                    && ! preg_match('/^data:image\/(?:png|jpe?g|webp);base64,/i', $value)) {
                    $element->removeAttribute($name);
                    continue;
                }
                if (preg_match('/url\s*\(\s*["\']?(?!#)/i', $value)) {
                    $element->removeAttribute($name);
                }
            }
        }

        foreach ($remove as $element) {
            $element->parentNode?->removeChild($element);
        }

        $svg = $document->saveXML($document->documentElement);
        if (! is_string($svg) || strlen($svg) > 2_000_000) {
            throw new RuntimeException('The SVG logo is too large.');
        }

        $path = trim($directory, '/').'/'.Str::uuid().'.svg';
        Storage::disk('public')->put($path, $svg);

        return $path;
    }

    private static function storeOriginal(UploadedFile $file, string $directory): string
    {
        $extension = strtolower($file->getClientOriginalExtension()) ?: 'img';
        $safeExtension = preg_match('/^[a-z0-9]{1,8}$/', $extension) ? $extension : 'img';

        return $file->storePubliclyAs(trim($directory, '/'), Str::uuid().'.'.$safeExtension, 'public');
    }
}
