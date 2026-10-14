<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageReport extends Model
{
    protected $fillable = ['reporter_id', 'reported_user_id', 'message_type', 'message_id', 'reported_body', 'reason', 'details', 'status', 'reviewed_by', 'reviewed_at'];
    protected function casts(): array { return ['reviewed_at' => 'datetime']; }
    public function reporter(): BelongsTo { return $this->belongsTo(User::class, 'reporter_id'); }
    public function reportedUser(): BelongsTo { return $this->belongsTo(User::class, 'reported_user_id'); }
}
