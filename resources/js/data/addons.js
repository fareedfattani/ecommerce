/** Fallback product add-ons — overridden by Settings → product_addons from cPanel. */
export const FALLBACK_ADDON_GROUPS = {
    ram: {
        label: 'RAM',
        options: [
            { id: '8gb', label: '8GB RAM', price: 0 },
            { id: '16gb', label: '16GB RAM', price: 8000 },
            { id: '32gb', label: '32GB RAM', price: 24000 },
        ],
    },
    storage: {
        label: 'Storage',
        options: [
            { id: '256gb', label: '256GB SSD', price: 0 },
            { id: '512gb', label: '512GB SSD/NVMe', price: 8000 },
            { id: '1tb', label: '1TB SSD/NVMe', price: 20000 },
        ],
    },
    warranty: {
        label: 'Warranty',
        options: [
            { id: '3m', label: '3 Months Warranty', price: 0 },
            { id: '6m', label: '6 Months Warranty', price: 0 },
            { id: '1y', label: '1 Year Warranty', price: 0 },
        ],
    },
};

export const DEFAULT_ADDONS = { ram: '8gb', storage: '256gb', warranty: '3m' };

/** @deprecated use resolveAddonGroups() — kept for older imports */
export const ADDON_GROUPS = FALLBACK_ADDON_GROUPS;

export function resolveAddonGroups(saved) {
    const catalog = {};
    for (const [group, fallback] of Object.entries(FALLBACK_ADDON_GROUPS)) {
        const incoming = saved?.[group] && typeof saved[group] === 'object' ? saved[group] : {};
        const byId = Object.fromEntries(
            (Array.isArray(incoming.options) ? incoming.options : [])
                .filter((o) => o && o.id)
                .map((o) => [String(o.id), o]),
        );
        catalog[group] = {
            label: String(incoming.label || fallback.label).trim() || fallback.label,
            options: fallback.options.map((fallbackOption) => {
                const option = byId[fallbackOption.id] || {};
                const label = String(option.label ?? fallbackOption.label).trim() || fallbackOption.label;
                const price = Math.max(0, Number(option.price ?? fallbackOption.price) || 0);
                return { id: fallbackOption.id, label, price };
            }),
        };
    }
    return catalog;
}

export function normalizeAddons(addons = {}, catalog = FALLBACK_ADDON_GROUPS) {
    const groups = resolveAddonGroups(catalog);
    const next = { ...DEFAULT_ADDONS };
    for (const group of Object.keys(groups)) {
        const id = addons[group];
        if (id && groups[group].options.some((o) => o.id === id)) next[group] = id;
    }
    return next;
}

export function addonExtra(addons = {}, catalog = FALLBACK_ADDON_GROUPS) {
    const groups = resolveAddonGroups(catalog);
    const selected = normalizeAddons(addons, groups);
    return Object.entries(selected).reduce((sum, [group, id]) => {
        const option = groups[group]?.options.find((o) => o.id === id);
        return sum + Number(option?.price || 0);
    }, 0);
}

export function addonSummary(addons = {}, catalog = FALLBACK_ADDON_GROUPS) {
    const groups = resolveAddonGroups(catalog);
    const selected = normalizeAddons(addons, groups);
    return Object.entries(selected).map(([group, id]) => {
        const option = groups[group]?.options.find((o) => o.id === id);
        return { group, id, label: option?.label || id, price: Number(option?.price || 0) };
    });
}

export function lineKey(productId, addons = {}, catalog = FALLBACK_ADDON_GROUPS) {
    const selected = normalizeAddons(addons, catalog);
    return `${productId}:${selected.ram}:${selected.storage}:${selected.warranty}`;
}

export function unitPrice(product, addons = {}, catalog = FALLBACK_ADDON_GROUPS) {
    const base = Number(product?.base_price ?? product?.sale_price ?? product?.price ?? 0);
    return base + addonExtra(addons, catalog);
}

/** Add-ons are only offered on used products. */
export function productAllowsAddons(product) {
    return String(product?.condition || '').trim().toLowerCase() === 'used';
}
