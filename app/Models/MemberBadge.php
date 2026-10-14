<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberBadge extends Model
{
    protected $fillable = ['user_id', 'badge', 'awarded_by'];
}
