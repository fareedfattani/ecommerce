<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $guarded = ['id'];
    protected function casts(): array { return ['subtotal'=>'decimal:2','shipping'=>'decimal:2','discount'=>'decimal:2','total'=>'decimal:2']; }
    public function coupon(): BelongsTo { return $this->belongsTo(Coupon::class); }
    public function items(): HasMany { return $this->hasMany(OrderItem::class); }
    public function statusHistory(): HasMany { return $this->hasMany(OrderStatusHistory::class)->latest(); }
}
