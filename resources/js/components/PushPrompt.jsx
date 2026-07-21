import { Bell, BellOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPushConfig, isLocallySubscribed, pushSupported, subscribeToPush } from '../lib/push';
import { useStore } from '../contexts/StoreContext';

export default function PushPrompt() {
    const { settings } = useStore();
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!pushSupported()) return;
            if (localStorage.getItem('nexify_push_dismissed') === '1') return;
            if (isLocallySubscribed() || Notification.permission === 'granted') return;
            if (Notification.permission === 'denied') return;
            try {
                const config = await getPushConfig();
                if (!cancelled && config.enabled && config.publicKey) setVisible(true);
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [settings?.push_enabled, settings?.vapid_public_key]);

    const dismiss = () => {
        localStorage.setItem('nexify_push_dismissed', '1');
        setVisible(false);
    };

    const enable = async () => {
        setBusy(true); setError('');
        try {
            const config = await getPushConfig();
            if (!config.enabled || !config.publicKey) throw new Error('Push notifications are not enabled.');
            await subscribeToPush(config.publicKey);
            setVisible(false);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Could not enable notifications.');
        } finally { setBusy(false); }
    };

    if (!visible) return null;

    return <div className="push-prompt" role="dialog" aria-label="Enable notifications">
        <button type="button" className="push-prompt-close" onClick={dismiss} aria-label="Dismiss"><X /></button>
        <div className="push-prompt-icon"><Bell /></div>
        <div>
            <strong>Get deal alerts</strong>
            <p>Enable push notifications for new laptops, sales and order updates.</p>
            {error && <small className="form-error">{error}</small>}
        </div>
        <div className="push-prompt-actions">
            <button type="button" className="btn btn-ghost" onClick={dismiss}><BellOff /> Not now</button>
            <button type="button" className="btn" disabled={busy} onClick={enable}>{busy ? 'Enabling…' : 'Enable'}</button>
        </div>
    </div>;
}
