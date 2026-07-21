import { Save, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, messageFrom, unwrap } from '../api/client';
import { Loading, money } from '../components/Common';
import { DEFAULT_SHIPPING } from '../data/shipping';
import { AdminPage } from './Dashboard';

export default function DeliveryCharges() {
    const [rates, setRates] = useState(DEFAULT_SHIPPING);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        api.get('/cp/shipping').then((r) => {
            const data = unwrap(r) || {};
            setRates({
                karachi: Number(data.karachi ?? data.shipping_karachi ?? DEFAULT_SHIPPING.karachi),
                other: Number(data.other ?? data.shipping_other ?? DEFAULT_SHIPPING.other),
            });
        }).finally(() => setLoading(false));
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus('');
        try {
            const saved = unwrap(await api.put('/cp/shipping', {
                shipping_karachi: Number(rates.karachi) || 0,
                shipping_other: Number(rates.other) || 0,
            })) || {};
            setRates({
                karachi: Number(saved.karachi ?? rates.karachi),
                other: Number(saved.other ?? rates.other),
            });
            setStatus('Delivery charges saved successfully.');
        } catch (err) {
            setStatus(messageFrom(err));
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <AdminPage><Loading /></AdminPage>;

    return (
        <AdminPage
            title="Delivery charges"
            subtitle="Set nationwide COD delivery rates. Karachi uses a local rate; all other cities use the nationwide rate."
            action={<button form="shipping-form" className="btn" disabled={busy}><Save /> {busy ? 'Saving…' : 'Save rates'}</button>}
        >
            <form id="shipping-form" onSubmit={save} className="settings-stack">
                <section className="admin-card settings-section">
                    <div>
                        <h2><Truck size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} /> Shipping rates</h2>
                        <p>These amounts are added at checkout when the customer selects a city.</p>
                    </div>
                    <div className="form-grid">
                        <label>
                            Karachi delivery (PKR)
                            <input type="number" min="0" step="1" required value={rates.karachi} onChange={(e) => setRates({ ...rates, karachi: e.target.value })} />
                        </label>
                        <label>
                            Other cities in Pakistan (PKR)
                            <input type="number" min="0" step="1" required value={rates.other} onChange={(e) => setRates({ ...rates, other: e.target.value })} />
                        </label>
                    </div>
                    <div className="shipping-rate-preview">
                        <div><span>Karachi</span><strong>{money(rates.karachi)}</strong></div>
                        <div><span>Lahore, Islamabad & all other cities</span><strong>{money(rates.other)}</strong></div>
                    </div>
                </section>
                {status && <div className="save-status">{status}</div>}
            </form>
        </AdminPage>
    );
}
