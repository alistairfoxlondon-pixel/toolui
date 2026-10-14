<?php

namespace App\Support;

use DOMDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

final class ImageOptimizer
{
    /**
     * Store an uploaded image as an optimized WebP.
     *
     * Raster uploads are resized and re-encoded iteratively until the stored
     * file is roughly 3–5% of the original size (a 95–97% reduction) while
     * quality stays above the acceptable floor. SVG logos are sanitized and
     * stored as-is.
     */
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
        $originalBytes = strlen($contents);
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

        // Aim for a ~95.5% reduction, never smaller than 8 KB.
        $targetBytes = max(8192, (int) floor($originalBytes * 0.045));

        $best = null;
        $attempts = [
            ['quality' => min(90, max(70, $quality)), 'scale' => 1.0],
            ['quality' => 72, 'scale' => 1.0],
            ['quality' => 64, 'scale' => 0.85],
            ['quality' => 58, 'scale' => 0.7],
        ];

        foreach ($attempts as $attempt) {
            $encoded = self::encode($source, $maxDimension, $attempt['scale'], $attempt['quality']);
            if ($encoded === null) {
                continue;
            }

            if ($best === null || strlen($encoded) < strlen($best)) {
                $best = $encoded;
            }
            if (strlen($encoded) <= $targetBytes) {
                break;
            }
        }

        imagedestroy($source);

        if (! is_string($best) || $best === '') {
            return self::storeOriginal($file, $directory);
        }

        $path = trim($directory, '/').'/'.Str::uuid().'.webp';
        Storage::disk('public')->put($path, $best);

        return $path;
    }

    private static function encode($source, int $maxDimension, float $scale, int $quality): ?string
    {
        if (! function_exists('imagewebp')) {
            return null;
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $targetWidth = max(1, (int) round($width * min(1, $maxDimension / max($width, $height)) * $scale));
        $targetHeight = max(1, (int) round($height * min(1, $maxDimension / max($width, $height)) * $scale));

        $target = imagecreatetruecolor($targetWidth, $targetHeight);
        if (! $target) {
            return null;
        }

        imagealphablending($target, false);
        imagesavealpha($target, true);
        $transparent = imagecolorallocatealpha($target, 255, 255, 255, 127);
        imagefill($target, 0, 0, $transparent);
        imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        $written = imagewebp($target, null, $quality);
        imagedestroy($target);
        $encoded = ob_get_clean();

        if (! $written || ! is_string($encoded) || $encoded === '') {
            return null;
        }

        return $encoded;
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
