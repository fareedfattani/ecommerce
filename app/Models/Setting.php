<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
class Setting extends Model
{
    protected $guarded = ['id'];

    public static function flat(): array
    {
        return static::all()->mapWithKeys(fn ($setting) => [
            $setting->key => match ($setting->type) {
                'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOL),
                'number' => (float) $setting->value,
                'json' => json_decode($setting->value, true),
                'image' => $setting->value ? Storage::disk('public')->url($setting->value) : null,
                default => $setting->value,
            },
        ])->toArray();
    }

    public static function grouped(): array
    {
        return static::all()->groupBy('group')->map(fn($rows) => $rows->mapWithKeys(fn($s) => [$s->key => match($s->type) {
            'boolean' => filter_var($s->value, FILTER_VALIDATE_BOOL), 'number' => (float) $s->value, 'json' => json_decode($s->value, true),
            'image' => $s->value ? Storage::disk('public')->url($s->value) : null, default => $s->value
        }]))->toArray();
    }
}
