/** Per-product free-form add-on helpers. Catalog shape: [{ id, label, options:[{id,label,price}] }] */

export function addonUid(prefix = 'a') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Normalize product.addons into a keyed map for lookups. */
export function resolveAddonGroups(catalog) {
    const list = normalizeCatalogList(catalog);
    return Object.fromEntries(list.map((group) => [group.id, { label: group.label, options: group.options }]));
}

export function normalizeCatalogList(catalog) {
    if (!catalog) return [];
    let rows = catalog;
    if (typeof catalog === 'string') {
        try { rows = JSON.parse(catalog); } catch { return []; }
    }
    if (!Array.isArray(rows) && rows && typeof rows === 'object') {
        rows = Object.entries(rows).map(([id, group]) => ({ ...(group || {}), id: group?.id || id }));
    }
    if (!Array.isArray(rows)) return [];

    const usedGroup = new Set();
    const result = [];
    for (const group of rows) {
        if (!group || typeof group !== 'object') continue;
        const label = String(group.label || '').trim();
        if (!label) continue;
        let id = String(group.id || '').trim() || slugify(label) || addonUid('g');
        id = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || addonUid('g');
        let base = id; let n = 1;
        while (usedGroup.has(id)) id = `${base}_${n++}`.slice(0, 40);
        usedGroup.add(id);

        const usedOpt = new Set();
        const options = [];
        for (const option of (Array.isArray(group.options) ? group.options : [])) {
            if (!option || typeof option !== 'object') continue;
            const optionLabel = String(option.label || '').trim();
            if (!optionLabel) continue;
            let oid = String(option.id || '').trim() || slugify(optionLabel) || addonUid('o');
            oid = oid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || addonUid('o');
            let obase = oid; let i = 1;
            while (usedOpt.has(oid)) oid = `${obase}_${i++}`.slice(0, 40);
            usedOpt.add(oid);
            options.push({ id: oid, label: optionLabel.slice(0, 120), price: Math.max(0, Number(option.price) || 0) });
        }
        if (!options.length) continue;
        result.push({ id, label: label.slice(0, 80), options });
    }
    return result;
}

function slugify(value) {
    return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export function catalogForProduct(product) {
    if (!product?.addons_enabled) return {};
    return resolveAddonGroups(product.addons);
}

export function productAllowsAddons(product) {
    return Boolean(product?.addons_enabled) && Object.keys(catalogForProduct(product)).length > 0;
}

export function defaultAddons(catalog = {}) {
    const groups = resolveAddonGroups(catalog);
    return Object.fromEntries(
        Object.entries(groups).map(([groupId, config]) => [groupId, config.options[0]?.id]).filter(([, id]) => id),
    );
}

export function normalizeAddons(addons = {}, catalog = {}) {
    const groups = resolveAddonGroups(catalog);
    const defaults = defaultAddons(groups);
    const next = {};
    for (const groupId of Object.keys(groups)) {
        const id = addons?.[groupId];
        if (id && groups[groupId].options.some((o) => o.id === id)) next[groupId] = id;
        else if (defaults[groupId]) next[groupId] = defaults[groupId];
    }
    return next;
}

export function addonExtra(addons = {}, catalog = {}) {
    const groups = resolveAddonGroups(catalog);
    const selected = normalizeAddons(addons, groups);
    return Object.entries(selected).reduce((sum, [groupId, id]) => {
        const option = groups[groupId]?.options.find((o) => o.id === id);
        return sum + Number(option?.price || 0);
    }, 0);
}

export function addonSummary(addons = {}, catalog = {}) {
    const groups = resolveAddonGroups(catalog);
    const selected = normalizeAddons(addons, groups);
    return Object.entries(selected).map(([groupId, id]) => {
        const option = groups[groupId]?.options.find((o) => o.id === id);
        return { group: groupId, id, label: option?.label || id, price: Number(option?.price || 0) };
    });
}

export function lineKey(productId, addons = {}, catalog = {}) {
    const selected = normalizeAddons(addons, catalog);
    const parts = Object.keys(selected).sort().map((groupId) => `${groupId}:${selected[groupId]}`);
    return parts.length ? `${productId}:${parts.join(':')}` : String(productId);
}

export function unitPrice(product, addons = {}, catalog = {}) {
    const base = Number(product?.base_price ?? product?.sale_price ?? product?.price ?? 0);
    return base + addonExtra(addons, catalog);
}

/** @deprecated kept for older imports */
export const FALLBACK_ADDON_GROUPS = {};
export const DEFAULT_ADDONS = {};
export const ADDON_GROUPS = FALLBACK_ADDON_GROUPS;
