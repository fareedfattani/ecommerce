import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';

function loadGtag(measurementId) {
    if (typeof window === 'undefined' || !measurementId) return;
    if (window.__nexifyGaId === measurementId && typeof window.gtag === 'function') return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.__nexifyGaId = measurementId;

    if (!document.getElementById('nexify-ga')) {
        const script = document.createElement('script');
        script.id = 'nexify-ga';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
    }

    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false });
}

export default function Analytics() {
    const { settings } = useStore();
    const location = useLocation();
    const id = String(settings?.google_analytics_id || '').trim();

    useEffect(() => {
        if (!id || location.pathname.startsWith('/cp')) return;
        loadGtag(id);
    }, [id, location.pathname]);

    useEffect(() => {
        if (!id || location.pathname.startsWith('/cp') || typeof window.gtag !== 'function') return;
        window.gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: location.pathname + location.search,
        });
    }, [id, location.pathname, location.search]);

    return null;
}
