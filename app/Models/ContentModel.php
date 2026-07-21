<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

abstract class ContentModel extends Model
{
    protected $guarded = ['id'];
    protected $appends = ['image_url'];
    protected function casts(): array { return ['is_active'=>'boolean','published_at'=>'datetime','sort_order'=>'integer']; }
    public function getImageUrlAttribute(): ?string { return isset($this->attributes['image']) && $this->image ? Storage::disk('public')->url($this->image) : null; }
}
