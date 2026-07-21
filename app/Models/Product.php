<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $guarded = ['id'];
    protected $appends = ['image_url', 'gallery_urls', 'effective_price'];

    protected function casts(): array
    {
        return ['price'=>'decimal:2','sale_price'=>'decimal:2','stock'=>'integer','is_featured'=>'boolean','is_sale'=>'boolean','is_active'=>'boolean','gallery'=>'array','specs'=>'array'];
    }

    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
    public function orderItems(): HasMany { return $this->hasMany(OrderItem::class); }
    public function scopeActive(Builder $query): Builder { return $query->where('is_active', true); }
    public function getImageUrlAttribute(): ?string { return $this->image ? Storage::disk('public')->url($this->image) : null; }
    public function getGalleryUrlsAttribute(): array { return array_map(fn ($path) => Storage::disk('public')->url($path), $this->gallery ?? []); }
    public function getEffectivePriceAttribute(): string { return (string) ($this->is_sale && $this->sale_price !== null ? $this->sale_price : $this->price); }
}
