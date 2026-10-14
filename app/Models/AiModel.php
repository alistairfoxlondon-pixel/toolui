<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiModel extends Model
{
    protected $fillable = ['name', 'provider', 'description', 'website_url', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function ratings(): HasMany { return $this->hasMany(AiModelRating::class); }
}
