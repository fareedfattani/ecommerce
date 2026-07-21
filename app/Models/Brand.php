<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Brand extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['is_active'=>'boolean'];
    protected $appends = ['logo_url'];
    public function products(): HasMany { return $this->hasMany(Product::class); }
    public function getLogoUrlAttribute(): ?string { return $this->logo ? Storage::disk('public')->url($this->logo) : null; }
}
