<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushController extends Controller
{
    public function config(WebPushService $push): JsonResponse
    {
        $enabled = (bool) (\App\Models\Setting::flat()['push_enabled'] ?? false);

        return response()->json([
            'enabled' => $enabled && $push->isConfigured(),
            'publicKey' => $enabled ? $push->publicKey() : null,
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => 'required|string|max:5000',
            'keys.p256dh' => 'required|string|max:255',
            'keys.auth' => 'required|string|max:255',
            'contentEncoding' => 'nullable|string|max:32',
        ]);

        $subscription = PushSubscription::upsertFromBrowser($data, $request->userAgent());

        return response()->json(['message' => 'Push subscription saved.', 'id' => $subscription->id], 201);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $data = $request->validate(['endpoint' => 'required|string|max:5000']);
        PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($data['endpoint']))
            ->update(['is_active' => false]);

        return response()->json(['message' => 'Push subscription removed.']);
    }
}
