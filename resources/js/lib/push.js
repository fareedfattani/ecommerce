import { api } from '../api/client';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export const pushSupported = () =>
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;

export async function registerPushWorker() {
    if (!pushSupported()) return null;
    return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export async function getPushConfig() {
    const { data } = await api.get('/push/config');
    return data;
}

export async function subscribeToPush(publicKey) {
    const registration = await registerPushWorker();
    if (!registration) throw new Error('Push is not supported in this browser.');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission was denied.');

    const ready = await navigator.serviceWorker.ready;
    let subscription = await ready.pushManager.getSubscription();
    if (!subscription) {
        subscription = await ready.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
    }

    const json = subscription.toJSON();
    await api.post('/push/subscribe', {
        endpoint: json.endpoint,
        keys: json.keys,
        contentEncoding: 'aes128gcm',
    });
    localStorage.setItem('nexify_push_subscribed', '1');
    return subscription;
}

export async function unsubscribeFromPush() {
    const ready = await navigator.serviceWorker.ready;
    const subscription = await ready.pushManager.getSubscription();
    if (subscription) {
        await api.post('/push/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});
        await subscription.unsubscribe();
    }
    localStorage.removeItem('nexify_push_subscribed');
}

export function isLocallySubscribed() {
    return localStorage.getItem('nexify_push_subscribed') === '1';
}
