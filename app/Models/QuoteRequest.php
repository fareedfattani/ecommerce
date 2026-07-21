<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class QuoteRequest extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['attachment_urls'];

    protected function casts(): array
    {
        return [
            'preferred_brands' => 'array',
            'networking_requirements' => 'array',
            'service_requirements' => 'array',
            'attachments' => 'array',
            'declaration' => 'boolean',
            'expected_delivery_date' => 'date',
        ];
    }

    public function getAttachmentUrlsAttribute(): array
    {
        return collect($this->attachments ?? [])->map(function ($path) {
            return [
                'path' => $path,
                'name' => basename($path),
                'url' => Storage::disk('public')->url($path),
            ];
        })->all();
    }
}
