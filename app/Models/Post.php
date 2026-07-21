<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Builder;
class Post extends ContentModel { public function scopePublished(Builder $q): Builder { return $q->where('is_active', true)->where(fn($x)=>$x->whereNull('published_at')->orWhere('published_at','<=',now())); } }
