<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductAddons
{
    /** Sanitize a free-form product add-on catalog (ordered list of groups). */
    public static function sanitize(mixed $input): array
    {
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            $input = is_array($decoded) ? $decoded : [];
        }
        if (! is_array($input)) {
            return [];
        }

        // Accept keyed map { ram: {label, options} } or list [{id,label,options}]
        $rows = array_is_list($input) ? $input : collect($input)->map(function ($group, $key) {
            if (! is_array($group)) {
                return null;
            }
            return array_merge($group, ['id' => $group['id'] ?? (string) $key]);
        })->filter()->values()->all();

        $usedGroupIds = [];
        $catalog = [];

        foreach ($rows as $group) {
            if (! is_array($group)) {
                continue;
            }

            $label = trim((string) ($group['label'] ?? ''));
            if ($label === '') {
                continue;
            }

            $groupId = trim((string) ($group['id'] ?? ''));
            if ($groupId === '') {
                $groupId = Str::slug($label) ?: 'addon';
            }
            $groupId = Str::limit(preg_replace('/[^a-zA-Z0-9_-]/', '', $groupId) ?: 'addon', 40, '');
            $base = $groupId;
            $n = 1;
            while (isset($usedGroupIds[$groupId])) {
                $groupId = Str::limit($base.'_'.$n++, 40, '');
            }
            $usedGroupIds[$groupId] = true;

            $usedOptionIds = [];
            $options = [];
            foreach (($group['options'] ?? []) as $option) {
                if (! is_array($option)) {
                    continue;
                }
                $optionLabel = trim((string) ($option['label'] ?? ''));
                if ($optionLabel === '') {
                    continue;
                }
                $optionId = trim((string) ($option['id'] ?? ''));
                if ($optionId === '') {
                    $optionId = Str::slug($optionLabel) ?: 'option';
                }
                $optionId = Str::limit(preg_replace('/[^a-zA-Z0-9_-]/', '', $optionId) ?: 'option', 40, '');
                $optBase = $optionId;
                $i = 1;
                while (isset($usedOptionIds[$optionId])) {
                    $optionId = Str::limit($optBase.'_'.$i++, 40, '');
                }
                $usedOptionIds[$optionId] = true;

                $options[] = [
                    'id' => $optionId,
                    'label' => Str::limit($optionLabel, 120, ''),
                    'price' => max(0, (float) ($option['price'] ?? 0)),
                ];
            }

            if ($options === []) {
                continue;
            }

            $catalog[] = [
                'id' => $groupId,
                'label' => Str::limit($label, 80, ''),
                'options' => $options,
            ];
        }

        return $catalog;
    }

    /** @return array<string, array{label:string,options:list<array{id:string,label:string,price:float}>}> */
    public static function catalogMap(?array $catalog): array
    {
        $map = [];
        foreach (self::sanitize($catalog) as $group) {
            $map[$group['id']] = [
                'label' => $group['label'],
                'options' => $group['options'],
            ];
        }

        return $map;
    }

    /** @return array<string, array<string, array{label:string,price:float}>> */
    public static function groups(?array $catalog = null): array
    {
        $groups = [];
        foreach (self::catalogMap($catalog) as $groupId => $config) {
            foreach ($config['options'] as $option) {
                $groups[$groupId][$option['id']] = [
                    'label' => $option['label'],
                    'price' => (float) $option['price'],
                ];
            }
        }

        return $groups;
    }

    public static function catalogForProduct(Product $product): array
    {
        if (! $product->addons_enabled) {
            return [];
        }

        return self::sanitize($product->addons);
    }

    public static function allowsAddons(Product $product): bool
    {
        return $product->addons_enabled && count(self::catalogForProduct($product)) > 0;
    }

    public static function defaults(?array $catalog = null): array
    {
        $selected = [];
        foreach (self::catalogMap($catalog) as $groupId => $config) {
            $first = $config['options'][0]['id'] ?? null;
            if ($first !== null) {
                $selected[$groupId] = $first;
            }
        }

        return $selected;
    }

    public static function normalize(?array $addons, ?array $catalog = null): array
    {
        $groups = self::groups($catalog);
        $defaults = self::defaults($catalog);
        $selected = [];
        foreach (array_keys($groups) as $groupId) {
            $id = $addons[$groupId] ?? null;
            if (is_string($id) && isset($groups[$groupId][$id])) {
                $selected[$groupId] = $id;
            } elseif (isset($defaults[$groupId])) {
                $selected[$groupId] = $defaults[$groupId];
            }
        }

        return $selected;
    }

    public static function validate(?array $addons, ?array $catalog = null): array
    {
        $catalog = self::sanitize($catalog);
        $groups = self::groups($catalog);
        $addons = is_array($addons) ? $addons : [];

        foreach (array_keys($groups) as $groupId) {
            if (! array_key_exists($groupId, $addons)) {
                continue;
            }
            $id = $addons[$groupId];
            if (! is_string($id) || ! isset($groups[$groupId][$id])) {
                throw ValidationException::withMessages([
                    "items.*.addons.{$groupId}" => ['Invalid add-on selected.'],
                ]);
            }
        }

        return self::normalize($addons, $catalog);
    }

    public static function forProduct(Product $product, ?array $addons): array
    {
        if (! self::allowsAddons($product)) {
            return ['addons' => null, 'summary' => [], 'extra' => 0.0];
        }

        $catalog = self::catalogForProduct($product);
        $selected = self::validate($addons, $catalog);

        return [
            'addons' => $selected,
            'summary' => self::summary($selected, $catalog),
            'extra' => self::extra($selected, $catalog),
        ];
    }

    public static function extra(array $addons, ?array $catalog = null): float
    {
        $groups = self::groups($catalog);
        $selected = self::normalize($addons, $catalog);
        $extra = 0.0;
        foreach ($selected as $groupId => $id) {
            $extra += (float) ($groups[$groupId][$id]['price'] ?? 0);
        }

        return $extra;
    }

    public static function summary(array $addons, ?array $catalog = null): array
    {
        $groups = self::groups($catalog);
        $selected = self::normalize($addons, $catalog);
        $lines = [];
        foreach ($selected as $groupId => $id) {
            $option = $groups[$groupId][$id] ?? null;
            if (! $option) {
                continue;
            }
            $lines[] = [
                'group' => $groupId,
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
