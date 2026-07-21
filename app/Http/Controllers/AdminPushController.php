<?php

namespace App\Http\Controllers;

use App\Models\PushNotification;
use App\Models\PushSubscription;
use App\Models\Setting;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminPushController extends Controller
{
    public function overview(WebPushService $push): JsonResponse
    {
        $settings = Setting::flat();

        return response()->json([
            'configured' => $push->isConfigured(),
            'enabled' => (bool) ($settings['push_enabled'] ?? false),
            'public_key' => $push->publicKey(),
            'subscribers' => PushSubscription::active()->count(),
            'total_subscribers' => PushSubscription::count(),
            'sent_campaigns' => PushNotification::where('status', 'sent')->count(),
        ]);
    }

    public function generateKeys(Request $request, WebPushService $push): JsonResponse
    {
        if ($request->boolean('rotate')) {
            Setting::whereIn('key', ['vapid_public_key', 'vapid_private_key'])->delete();
        }

        $keys = $push->ensureKeys();

        return response()->json([
            'message' => $request->boolean('rotate') ? 'VAPID keys rotated. Ask customers to subscribe again.' : 'VAPID keys ready.',
            'public_key' => $keys['publicKey'],
            'configured' => true,
            'enabled' => true,
        ]);
    }

    public function saveSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'push_enabled' => 'nullable|boolean',
            'vapid_subject' => 'nullable|string|max:180',
        ]);

        if (array_key_exists('push_enabled', $data)) {
            Setting::updateOrCreate(['key' => 'push_enabled'], [
                'value' => $request->boolean('push_enabled') ? '1' : '0',
                'type' => 'boolean',
                'group' => 'push',
            ]);
        }
        if (array_key_exists('vapid_subject', $data) && $data['vapid_subject'] !== null) {
            Setting::updateOrCreate(['key' => 'vapid_subject'], [
                'value' => $data['vapid_subject'],
                'type' => 'text',
                'group' => 'push',
            ]);
        }

        return $this->overview(app(WebPushService::class));
    }

    public function notifications(Request $request): JsonResponse
    {
        $q = PushNotification::with('creator:id,name')->latest();
        if ($search = $request->string('search')->trim()->value()) {
            $q->where(fn ($x) => $x->where('title', 'like', "%$search%")->orWhere('body', 'like', "%$search%"));
        }

        return response()->json($q->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function store(Request $request, WebPushService $push): JsonResponse
    {
        $data = $this->validated($request);
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('push', 'public');
        }
        $data['created_by'] = $request->user()->id;
        $data['status'] = $request->boolean('send_now') ? 'draft' : 'draft';

        $notification = PushNotification::create($data);

        if ($request->boolean('send_now')) {
            if (! $push->isConfigured()) {
                return response()->json(['message' => 'Generate VAPID keys before sending.', 'data' => $notification], 422);
            }
            if (PushSubscription::active()->count() === 0) {
                return response()->json(['message' => 'No active push subscribers yet.', 'data' => $notification], 422);
            }
            $notification = $push->send($notification);
        }

        return response()->json(['data' => $notification, 'message' => $notification->status === 'sent' ? 'Notification sent.' : 'Draft saved.'], 201);
    }

    public function send(int $id, WebPushService $push): JsonResponse
    {
        $notification = PushNotification::findOrFail($id);
        if (! $push->isConfigured()) {
            return response()->json(['message' => 'Generate VAPID keys before sending.'], 422);
        }
        if (PushSubscription::active()->count() === 0) {
            return response()->json(['message' => 'No active push subscribers yet.'], 422);
        }
        if ($notification->status === 'sending') {
            return response()->json(['message' => 'This notification is already sending.'], 422);
        }

        return response()->json(['data' => $push->send($notification), 'message' => 'Notification sent.']);
    }

    public function destroyNotification(int $id): JsonResponse
    {
        $notification = PushNotification::findOrFail($id);
        if ($notification->image) {
            Storage::disk('public')->delete($notification->image);
        }
        $notification->delete();

        return response()->json(null, 204);
    }

    public function subscribers(Request $request): JsonResponse
    {
        $q = PushSubscription::latest();
        if ($request->has('active')) {
            $q->where('is_active', $request->boolean('active'));
        }

        return response()->json($q->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function destroySubscriber(int $id): JsonResponse
    {
        PushSubscription::findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:120',
            'body' => 'required|string|max:500',
            'url' => 'nullable|string|max:500',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:2048',
            'send_now' => 'nullable|boolean',
        ]);
    }
}
