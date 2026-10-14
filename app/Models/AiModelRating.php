<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiModelRating extends Model
{
    protected $fillable = ['ai_model_id', 'user_id', 'score'];
    protected function casts(): array { return ['score' => 'integer']; }
}
