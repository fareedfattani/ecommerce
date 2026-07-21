<?php

namespace App\Support;

use App\Models\Setting;

class Shipping
{
    public const DEFAULT_KARACHI = 700;

    public const DEFAULT_OTHER = 1700;

    /** Major Pakistan cities for checkout dropdown. */
    public const CITIES = [
        'Karachi',
        'Lahore',
        'Islamabad',
        'Rawalpindi',
        'Faisalabad',
        'Multan',
        'Peshawar',
        'Quetta',
        'Hyderabad',
        'Gujranwala',
        'Sialkot',
        'Sargodha',
        'Bahawalpur',
        'Sukkur',
        'Larkana',
        'Sheikhupura',
        'Jhang',
        'Rahim Yar Khan',
        'Gujrat',
        'Mardan',
        'Kasur',
        'Mingora',
        'Dera Ghazi Khan',
        'Sahiwal',
        'Nawabshah',
        'Okara',
        'Mirpur Khas',
        'Chiniot',
        'Kamoke',
        'Sadiqabad',
        'Burewala',
        'Jacobabad',
        'Muzaffargarh',
        'Muridke',
        'Jhelum',
        'Hafizabad',
        'Kohat',
        'Khanewal',
        'Dera Ismail Khan',
        'Gojra',
        'Bahawalnagar',
        'Pakpattan',
        'Abbottabad',
        'Tando Adam',
        'Khairpur',
        'Chishtian',
        'Daska',
        'Dadu',
        'Mandi Bahauddin',
        'Ahmadpur East',
        'Kamalia',
        'Khuzdar',
        'Vihari',
        'Bannu',
        'Charsadda',
        'Nowshera',
        'Swabi',
        'Taxila',
        'Wah Cantonment',
        'Attock',
        'Mansehra',
        'Gwadar',
        'Turbat',
        'Hub',
        'Mirpur',
        'Muzaffarabad',
        'Gilgit',
        'Skardu',
        'Kotli',
        'Bhimber',
        'Thatta',
        'Badin',
        'Jamshoro',
        'Shikarpur',
        'Tando Allahyar',
        'Umerkot',
        'Hala',
        'Mianwali',
        'Bhakkar',
        'Layyah',
        'Chakwal',
        'Talagang',
        'Haripur',
        'Batagram',
        'Timergara',
        'Chaman',
        'Zhob',
        'Other',
    ];

    public static function rates(?array $saved = null): array
    {
        if ($saved === null) {
            $flat = Setting::flat();
            $saved = [
                'karachi' => $flat['shipping_karachi'] ?? null,
                'other' => $flat['shipping_other'] ?? null,
            ];
        }

        return [
            'karachi' => max(0, (float) ($saved['karachi'] ?? self::DEFAULT_KARACHI)),
            'other' => max(0, (float) ($saved['other'] ?? self::DEFAULT_OTHER)),
        ];
    }

    public static function isKarachi(string $city): bool
    {
        $normalized = mb_strtolower(trim($city));
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? $normalized;

        return in_array($normalized, ['karachi', 'khi'], true)
            || str_starts_with($normalized, 'karachi');
    }

    public static function chargeForCity(string $city, ?array $rates = null): float
    {
        $rates ??= self::rates();

        return self::isKarachi($city) ? $rates['karachi'] : $rates['other'];
    }

    public static function cities(): array
    {
        return self::CITIES;
    }

    public static function assertValidCity(string $city): string
    {
        $city = trim($city);
        foreach (self::CITIES as $allowed) {
            if (strcasecmp($allowed, $city) === 0) {
                return $allowed;
            }
        }

        return $city;
    }
}
