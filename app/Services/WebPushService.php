<?php

namespace App\Services;

use App\Models\PushNotification;
use App\Models\PushSubscription;
use App\Models\Setting;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\VAPID;
use Minishlink\WebPush\WebPush;
use RuntimeException;

class WebPushService
{
    public function isConfigured(): bool
    {
        $settings = Setting::flat();

        return ! empty($settings['vapid_public_key']) && ! empty($settings['vapid_private_key']);
    }

    public function publicKey(): ?string
    {
        return Setting::flat()['vapid_public_key'] ?? null;
    }

    public function ensureKeys(): array
    {
        $settings = Setting::flat();
        if (! empty($settings['vapid_public_key']) && ! empty($settings['vapid_private_key'])) {
            return [
                'publicKey' => $settings['vapid_public_key'],
                'privateKey' => $settings['vapid_private_key'],
            ];
        }

        $keys = VAPID::createVapidKeys();
        Setting::updateOrCreate(['key' => 'vapid_public_key'], [
            'value' => $keys['publicKey'],
            'type' => 'text',
            'group' => 'push',
        ]);
        Setting::updateOrCreate(['key' => 'vapid_private_key'], [
            'value' => $keys['privateKey'],
            'type' => 'text',
            'group' => 'push',
        ]);
        Setting::updateOrCreate(['key' => 'push_enabled'], [
            'value' => '1',
            'type' => 'boolean',
            'group' => 'push',
        ]);

        return $keys;
    }

    public function client(): WebPush
    {
        $settings = Setting::flat();
        if (empty($settings['vapid_public_key']) || empty($settings['vapid_private_key'])) {
            throw new RuntimeException('Web push is not configured. Generate VAPID keys first.');
        }

        $subject = $settings['vapid_subject'] ?? ('mailto:'.($settings['email'] ?? 'admin@'.parse_url(config('app.url'), PHP_URL_HOST)));

        return new WebPush([
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $settings['vapid_public_key'],
                'privateKey' => $settings['vapid_private_key'],
            ],
        ]);
    }

    public function send(PushNotification $notification): PushNotification
    {
        $payload = json_encode([
            'title' => $notification->title,
            'body' => $notification->body,
            'url' => $notification->url ?: url('/'),
            'image' => $notification->image_url,
            'tag' => 'nexify-'.$notification->id,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $webPush = $this->client();
        $sent = 0;
        $failed = 0;

        $notification->update(['status' => 'sending']);

        PushSubscription::active()->orderBy('id')->chunkById(100, function ($subscriptions) use ($webPush, $payload, &$sent, &$failed) {
            foreach ($subscriptions as $subscription) {
                try {
                    $webPush->queueNotification(
                        Subscription::create([
                            'endpoint' => $subscription->endpoint,
                            'publicKey' => $subscription->public_key,
                            'authToken' => $subscription->auth_token,
                            'contentEncoding' => $subscription->content_encoding ?: 'aes128gcm',
                        ]),
                        $payload
                    );
                } catch (\Throwable) {
                    $subscription->update(['is_active' => false]);
                    $failed++;
                }
            }

            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    $sent++;
                    $endpoint = $report->getEndpoint();
                    PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($endpoint))
                        ->update(['last_used_at' => now()]);
                } else {
                    $failed++;
                    $endpoint = $report->getEndpoint();
                    $code = $report->getResponse()?->getStatusCode();
                    if (in_array($code, [404, 410], true)) {
                        PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($endpoint))
                            ->update(['is_active' => false]);
                    }
                }
            }
        });

        $notification->update([
            'status' => 'sent',
            'sent_count' => $sent,
            'fail_count' => $failed,
            'sent_at' => now(),
        ]);

        return $notification->fresh();
    }
}
