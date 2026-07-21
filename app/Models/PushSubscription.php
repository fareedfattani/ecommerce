<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PushSubscription extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public static function hashEndpoint(string $endpoint): string
    {
        return hash('sha256', $endpoint);
    }

    public static function upsertFromBrowser(array $data, ?string $userAgent = null): self
    {
        $endpoint = $data['endpoint'];

        return static::updateOrCreate(
            ['endpoint_hash' => static::hashEndpoint($endpoint)],
            [
                'endpoint' => $endpoint,
                'public_key' => $data['keys']['p256dh'] ?? $data['public_key'] ?? null,
                'auth_token' => $data['keys']['auth'] ?? $data['auth_token'] ?? null,
                'content_encoding' => $data['contentEncoding'] ?? $data['content_encoding'] ?? 'aes128gcm',
                'user_agent' => $userAgent ? Str::limit($userAgent, 250, '') : null,
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );
    }
}
