<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'addons')) {
            Schema::table('products', function (Blueprint $table) {
                $table->json('addons')->nullable()->after('addons_enabled');
            });
        }

        $global = Setting::where('key', 'product_addons')->value('value');
        $globalCatalog = is_string($global) ? json_decode($global, true) : null;
        if (! is_array($globalCatalog)) {
            $globalCatalog = [
                'ram' => [
                    'label' => 'RAM',
                    'options' => [
                        ['id' => '8gb', 'label' => '8GB RAM', 'price' => 0],
                        ['id' => '16gb', 'label' => '16GB RAM', 'price' => 8000],
                        ['id' => '32gb', 'label' => '32GB RAM', 'price' => 24000],
                    ],
                ],
                'storage' => [
                    'label' => 'Storage',
                    'options' => [
                        ['id' => '256gb', 'label' => '256GB SSD', 'price' => 0],
                        ['id' => '512gb', 'label' => '512GB SSD/NVMe', 'price' => 8000],
                        ['id' => '1tb', 'label' => '1TB SSD/NVMe', 'price' => 20000],
                    ],
                ],
                'warranty' => [
                    'label' => 'Warranty',
                    'options' => [
                        ['id' => '3m', 'label' => '3 Months Warranty', 'price' => 0],
                        ['id' => '6m', 'label' => '6 Months Warranty', 'price' => 0],
                        ['id' => '1y', 'label' => '1 Year Warranty', 'price' => 0],
                    ],
                ],
            ];
        }

        $products = DB::table('products')->select('id', 'addons_enabled', 'enabled_addons')->get();
        foreach ($products as $product) {
            $keys = json_decode((string) $product->enabled_addons, true);
            if (! is_array($keys) || ! $product->addons_enabled) {
                DB::table('products')->where('id', $product->id)->update(['addons' => json_encode([])]);
                continue;
            }

            $groups = [];
            foreach ($keys as $key) {
                $key = (string) $key;
                $group = $globalCatalog[$key] ?? null;
                if (! is_array($group)) {
                    continue;
                }
                $groups[] = [
                    'id' => $key,
                    'label' => (string) ($group['label'] ?? ucfirst($key)),
                    'options' => array_values(array_map(function ($option) {
                        return [
                            'id' => (string) ($option['id'] ?? ''),
                            'label' => (string) ($option['label'] ?? ''),
                            'price' => max(0, (float) ($option['price'] ?? 0)),
                        ];
                    }, is_array($group['options'] ?? null) ? $group['options'] : [])),
                ];
            }

            DB::table('products')->where('id', $product->id)->update([
                'addons' => json_encode(array_values(array_filter($groups, fn ($g) => $g['id'] !== '' && count($g['options'])))),
            ]);
        }

        if (Schema::hasColumn('products', 'enabled_addons')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('enabled_addons');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('products', 'enabled_addons')) {
            Schema::table('products', function (Blueprint $table) {
                $table->json('enabled_addons')->nullable()->after('addons_enabled');
            });
        }

        $products = DB::table('products')->select('id', 'addons')->get();
        foreach ($products as $product) {
            $addons = json_decode((string) $product->addons, true);
            $keys = [];
            if (is_array($addons)) {
                foreach ($addons as $group) {
                    if (is_array($group) && ! empty($group['id'])) {
                        $keys[] = (string) $group['id'];
                    }
                }
            }
            DB::table('products')->where('id', $product->id)->update([
                'enabled_addons' => json_encode($keys),
            ]);
        }

        if (Schema::hasColumn('products', 'addons')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('addons');
            });
        }
    }
};
