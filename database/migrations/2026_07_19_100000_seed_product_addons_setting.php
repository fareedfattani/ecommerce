<?php

use App\Models\Setting;
use App\Support\ProductAddons;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Setting::updateOrCreate(
            ['key' => 'product_addons'],
            [
                'value' => json_encode(ProductAddons::FALLBACK),
                'type' => 'json',
                'group' => 'commerce',
            ]
        );
    }

    public function down(): void
    {
        Setting::where('key', 'product_addons')->delete();
    }
};
