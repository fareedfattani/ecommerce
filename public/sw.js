/* Nexify web push service worker */
self.addEventListener('push', (event) => {
    let data = { title: 'Nexify', body: 'You have a new update.', url: '/' };
    try {
        if (event.data) data = { ...data, ...event.data.json() };
    } catch (_) {}

    event.waitUntil(
        self.registration.showNotification(data.title || 'Nexify', {
            body: data.body || '',
            icon: data.icon || '/nexify-logo.png',
            badge: data.badge || '/nexify-logo.png',
            image: data.image || undefined,
            data: { url: data.url || '/' },
            tag: data.tag || 'nexify-push',
            renotify: true,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) {
                    return client.focus().then((focused) => {
                        if (focused && 'navigate' in focused) return focused.navigate(target);
                        return focused;
                    });
                }
            }
            if (clients.openWindow) return clients.openWindow(target);
        })
    );
});
