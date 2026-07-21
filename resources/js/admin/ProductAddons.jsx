import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, messageFrom, unwrap } from '../api/client';
import { Loading } from '../components/Common';
import { FALLBACK_ADDON_GROUPS, resolveAddonGroups } from '../data/addons';
import { AdminPage } from './Dashboard';

export default function ProductAddons() {
    const [addons, setAddons] = useState(FALLBACK_ADDON_GROUPS);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        api.get('/cp/product-addons').then((r) => {
            const data = unwrap(r) || {};
            setAddons(resolveAddonGroups(data.product_addons || data));
        }).finally(() => setLoading(false));
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus('');
        try {
            const catalog = resolveAddonGroups(addons);
            const saved = unwrap(await api.put('/cp/product-addons', { product_addons: catalog })) || {};
            setAddons(resolveAddonGroups(saved.product_addons || saved));
            setStatus('Product add-ons saved successfully.');
        } catch (err) {
            setStatus(messageFrom(err));
        } finally {
            setBusy(false);
        }
    };

    const updateGroupLabel = (group, label) => {
        setAddons((current) => {
            const catalog = resolveAddonGroups(current);
            return { ...catalog, [group]: { ...catalog[group], label } };
        });
    };

    const updateOption = (group, optionId, field, value) => {
        setAddons((current) => {
            const catalog = resolveAddonGroups(current);
            return {
                ...catalog,
                [group]: {
                    ...catalog[group],
                    options: catalog[group].options.map((option) =>
                        option.id === optionId ? { ...option, [field]: value } : option,
                    ),
                },
            };
        });
    };

    if (loading) return <AdminPage><Loading /></AdminPage>;

    const catalog = resolveAddonGroups(addons);

    return (
        <AdminPage
            title="Product add-ons"
            subtitle="Edit RAM, storage and warranty titles and prices shown on every product."
            action={<button form="product-addons-form" className="btn" disabled={busy}><Save /> {busy ? 'Saving…' : 'Save add-ons'}</button>}
        >
            <form id="product-addons-form" onSubmit={save} className="settings-stack">
                <section className="admin-card settings-section">
                    <div>
                        <h2>Upgrade options</h2>
                        <p>Default included options stay 8GB RAM, 256GB SSD and 3 months warranty.</p>
                    </div>
                    <div className="addons-admin">
                        {Object.entries(catalog).map(([groupKey, group]) => (
                            <div className="addons-admin-group" key={groupKey}>
                                <label className="full">
                                    {groupKey.toUpperCase()} group title
                                    <input value={group.label} onChange={(e) => updateGroupLabel(groupKey, e.target.value)} />
                                </label>
                                <div className="addons-admin-rows">
                                    <div className="addons-admin-head"><span>Option</span><span>Title</span><span>Price (PKR)</span></div>
                                    {group.options.map((option) => (
                                        <div className="addons-admin-row" key={option.id}>
                                            <code>{option.id}</code>
                                            <input value={option.label} onChange={(e) => updateOption(groupKey, option.id, 'label', e.target.value)} />
                                            <input type="number" min="0" step="1" value={option.price} onChange={(e) => updateOption(groupKey, option.id, 'price', e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                {status && <div className="save-status">{status}</div>}
            </form>
        </AdminPage>
    );
}
