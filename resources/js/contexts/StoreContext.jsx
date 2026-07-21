import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, unwrap } from '../api/client';
import { DEFAULT_ADDONS, addonExtra, addonSummary, lineKey, normalizeAddons, productAllowsAddons, resolveAddonGroups } from '../data/addons';

const StoreContext = createContext(null);
const CartContext = createContext(null);

const fallback = {
    settings: {
        site_name: 'Nexify',
        announcement: 'Free delivery across Pakistan on qualifying orders',
        primary_color: '#0867d1',
        secondary_color: '#08b9d6',
        dark_color: '#071b33',
        whatsapp: '923001234567',
        phone: '+92 300 1234567',
        email: 'hello@nexify.pk',
        address: 'Pakistan',
    },
    categories: [],
    brands: [],
    featured_products: [],
    sale_products: [],
    banners: [],
    testimonials: [],
    faqs: [],
    posts: [],
};

export function StoreProvider({ children }) {
    const [store, setStore] = useState(fallback);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/storefront')
            .then((result) => setStore((current) => ({ ...current, ...unwrap(result) })))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const s = store.settings ?? {};
        const root = document.documentElement;
        root.style.setProperty('--primary', s.primary_color || '#0867d1');
        root.style.setProperty('--accent', s.secondary_color || '#08b9d6');
        root.style.setProperty('--navy', s.dark_color || '#071b33');
        document.title = s.site_name ? `${s.site_name} — Technology, delivered` : 'Nexify';

        if (s.favicon) {
            const href = s.favicon.startsWith('http') || s.favicon.startsWith('/')
                ? s.favicon
                : `/storage/${s.favicon}`;
            const ensure = (rel) => {
                let link = document.querySelector(`link[rel="${rel}"]`);
                if (!link) {
                    link = document.createElement('link');
                    link.rel = rel;
                    document.head.appendChild(link);
                }
                link.href = href;
                if (rel === 'icon') link.type = 'image/png';
            };
            ensure('icon');
            ensure('shortcut icon');
            ensure('apple-touch-icon');
        }
    }, [store.settings]);

    const value = useMemo(() => ({ ...store, loading }), [store, loading]);
    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function buildCartLine(product, quantity = 1, addons = DEFAULT_ADDONS, catalog) {
    const groups = resolveAddonGroups(catalog);
    const allows = productAllowsAddons(product);
    const selected = allows ? normalizeAddons(addons || DEFAULT_ADDONS, groups) : null;
    const base_price = Number(product.base_price ?? product.sale_price ?? product.price ?? 0);
    const price = base_price + (selected ? addonExtra(selected, groups) : 0);
    return {
        ...product,
        quantity,
        addons: selected,
        addon_summary: selected ? addonSummary(selected, groups) : [],
        lineKey: selected ? lineKey(product.id, selected, groups) : String(product.id),
        base_price,
        unit_price: price,
    };
}

export function CartProvider({ children }) {
    const store = useStore();
    const catalog = useMemo(() => resolveAddonGroups(store.settings?.product_addons), [store.settings?.product_addons]);
    const catalogKey = useMemo(() => JSON.stringify(catalog), [catalog]);

    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('nexify-cart')) ?? [];
        } catch {
            return [];
        }
    });
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        setItems((current) => current.map((item) => {
            const { unit_price, lineKey: _lk, addon_summary: _as, ...product } = item;
            return buildCartLine(product, item.quantity || 1, item.addons || DEFAULT_ADDONS, catalog);
        }));
    }, [catalogKey]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => localStorage.setItem('nexify-cart', JSON.stringify(items)), [items]);

    const add = (product, quantity = 1, addons = DEFAULT_ADDONS) => {
        const line = buildCartLine(product, quantity, addons, catalog);
        setItems((current) => {
            const found = current.find((item) => item.lineKey === line.lineKey);
            if (found) {
                return current.map((item) =>
                    item.lineKey === line.lineKey ? { ...item, quantity: item.quantity + quantity } : item,
                );
            }
            return [...current, line];
        });
        setDrawerOpen(true);
    };
    const update = (key, quantity) => setItems((current) =>
        quantity < 1
            ? current.filter((item) => (item.lineKey || item.id) !== key)
            : current.map((item) => ((item.lineKey || item.id) === key ? { ...item, quantity } : item)));
    const remove = (key) => setItems((current) => current.filter((item) => (item.lineKey || item.id) !== key));
    const clear = () => setItems([]);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + Number(item.unit_price ?? item.sale_price ?? item.price ?? 0) * item.quantity, 0);

    return <CartContext.Provider value={{ items, add, update, remove, clear, count, total, drawerOpen, setDrawerOpen, catalog }}>{children}</CartContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
export const useCart = () => useContext(CartContext);
