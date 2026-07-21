<?php

use App\Models\Setting;
use App\Support\Shipping;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Setting::updateOrCreate(
            ['key' => 'shipping_karachi'],
            ['value' => (string) Shipping::DEFAULT_KARACHI, 'type' => 'number', 'group' => 'commerce']
        );
        Setting::updateOrCreate(
            ['key' => 'shipping_other'],
            ['value' => (string) Shipping::DEFAULT_OTHER, 'type' => 'number', 'group' => 'commerce']
        );
    }

    public function down(): void
    {
        Setting::whereIn('key', ['shipping_karachi', 'shipping_other'])->delete();
    }
};
