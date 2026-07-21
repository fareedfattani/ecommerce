<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Validation\ValidationException;

class ProductAddons
{
    public const FALLBACK = [
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

    public const DEFAULTS = [
        'ram' => '8gb',
        'storage' => '256gb',
        'warranty' => '3m',
    ];

    public static function catalog(?array $saved = null): array
    {
        if ($saved === null) {
            $flat = Setting::flat();
            $saved = is_array($flat['product_addons'] ?? null) ? $flat['product_addons'] : null;
        }

        return self::sanitize($saved);
    }

    /** @return array<string, array<string, array{label:string,price:float}>> */
    public static function groups(?array $catalog = null): array
    {
        $catalog ??= self::catalog();
        $groups = [];
        foreach ($catalog as $group => $config) {
            foreach ($config['options'] as $option) {
                $groups[$group][$option['id']] = [
                    'label' => $option['label'],
                    'price' => (float) $option['price'],
                ];
            }
        }

        return $groups;
    }

    public static function sanitize(?array $input): array
    {
        $catalog = [];
        foreach (self::FALLBACK as $group => $fallback) {
            $incoming = is_array($input[$group] ?? null) ? $input[$group] : [];
            $label = trim((string) ($incoming['label'] ?? $fallback['label']));
            if ($label === '') {
                $label = $fallback['label'];
            }

            $byId = [];
            foreach (($incoming['options'] ?? []) as $option) {
                if (! is_array($option) || empty($option['id'])) {
                    continue;
                }
                $byId[(string) $option['id']] = $option;
            }

            $options = [];
            foreach ($fallback['options'] as $fallbackOption) {
                $id = $fallbackOption['id'];
                $option = $byId[$id] ?? [];
                $optionLabel = trim((string) ($option['label'] ?? $fallbackOption['label']));
                if ($optionLabel === '') {
                    $optionLabel = $fallbackOption['label'];
                }
                $options[] = [
                    'id' => $id,
                    'label' => $optionLabel,
                    'price' => max(0, (float) ($option['price'] ?? $fallbackOption['price'])),
                ];
            }

            $catalog[$group] = ['label' => $label, 'options' => $options];
        }

        return $catalog;
    }

    public static function normalize(?array $addons, ?array $catalog = null): array
    {
        $groups = self::groups($catalog);
        $selected = self::DEFAULTS;
        foreach (array_keys($groups) as $group) {
            $id = $addons[$group] ?? null;
            if (is_string($id) && isset($groups[$group][$id])) {
                $selected[$group] = $id;
            }
        }

        return $selected;
    }

    public static function allowsAddons(?string $condition): bool
    {
        return strtolower(trim((string) $condition)) === 'used';
    }

    public static function validate(?array $addons): array
    {
        $catalog = self::catalog();
        $groups = self::groups($catalog);
        $addons = is_array($addons) ? $addons : [];
        foreach (array_keys($groups) as $group) {
            if (! array_key_exists($group, $addons)) {
                continue;
            }
            $id = $addons[$group];
            if (! is_string($id) || ! isset($groups[$group][$id])) {
                throw ValidationException::withMessages([
                    "items.*.addons.{$group}" => ["Invalid {$group} add-on selected."],
                ]);
            }
        }

        return self::normalize($addons, $catalog);
    }

    /** Resolve add-ons for an order line; non-used products never get paid upgrades. */
    public static function forProduct(?string $condition, ?array $addons): array
    {
        if (! self::allowsAddons($condition)) {
            return ['addons' => null, 'summary' => [], 'extra' => 0.0];
        }

        $selected = self::validate($addons);

        return [
            'addons' => $selected,
            'summary' => self::summary($selected),
            'extra' => self::extra($selected),
        ];
    }

    public static function extra(array $addons, ?array $catalog = null): float
    {
        $catalog ??= self::catalog();
        $groups = self::groups($catalog);
        $selected = self::normalize($addons, $catalog);
        $extra = 0.0;
        foreach ($selected as $group => $id) {
            $extra += (float) ($groups[$group][$id]['price'] ?? 0);
        }

        return $extra;
    }

    public static function summary(array $addons, ?array $catalog = null): array
    {
        $catalog ??= self::catalog();
        $groups = self::groups($catalog);
        $selected = self::normalize($addons, $catalog);
        $lines = [];
        foreach ($selected as $group => $id) {
            $option = $groups[$group][$id];
            $lines[] = [
                'group' => $group,
                'id' => $id,
                'label' => $option['label'],
                'price' => (float) $option['price'],
            ];
        }

        return $lines;
    }

    public static function unitPrice(float $basePrice, array $addons, ?array $catalog = null): float
    {
        return round($basePrice + self::extra($addons, $catalog), 2);
    }
}
