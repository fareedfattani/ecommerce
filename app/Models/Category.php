<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Category extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['is_active'=>'boolean','sort_order'=>'integer'];
    protected $appends = ['image_url'];
    public function products(): HasMany { return $this->hasMany(Product::class); }
    public function getImageUrlAttribute(): ?string { return $this->image ? Storage::disk('public')->url($this->image) : null; }
}
