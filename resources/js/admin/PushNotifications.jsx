import { Bell, KeyRound, Send, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, listFrom, messageFrom, toFormData } from '../api/client';
import { Empty, ErrorState, Loading, Modal, Pagination } from '../components/Common';
import { AdminPage } from './Dashboard';

export default function PushNotifications() {
    const [overview, setOverview] = useState(null);
    const [tab, setTab] = useState('compose');
    const [campaigns, setCampaigns] = useState({ items: [], meta: {} });
    const [subscribers, setSubscribers] = useState({ items: [], meta: {} });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [open, setOpen] = useState(false);

    const loadOverview = () => api.get('/cp/push').then((r) => setOverview(r.data));
    const loadCampaigns = (p = page) => api.get('/cp/push/notifications', { params: { page: p } }).then((r) => setCampaigns(listFrom(r)));
    const loadSubscribers = (p = page) => api.get('/cp/push/subscribers', { params: { page: p, active: 1 } }).then((r) => setSubscribers(listFrom(r)));

    const refresh = async () => {
        setLoading(true); setError('');
        try {
            await loadOverview();
            if (tab === 'history') await loadCampaigns(page);
            if (tab === 'subscribers') await loadSubscribers(page);
        } catch (e) { setError(messageFrom(e)); }
        finally { setLoading(false); }
    };

    useEffect(() => { refresh(); }, [tab, page]);

    const generateKeys = async (force = false) => {
        if (force && !confirm('Regenerating keys will invalidate existing browser subscriptions. Continue?')) return;
        setStatus('');
        try {
            const { data } = await api.post('/cp/push/keys' + (force ? '?rotate=1' : ''));
            setOverview((prev) => ({ ...prev, ...data, configured: true, enabled: true }));
            setStatus(data.message || 'VAPID keys generated.');
        } catch (e) { setStatus(messageFrom(e)); }
    };

    const toggleEnabled = async () => {
        try {
            const { data } = await api.post('/cp/push/settings', { push_enabled: !overview?.enabled });
            setOverview((prev) => ({ ...prev, ...data }));
            setStatus(data.enabled ? 'Push notifications enabled on storefront.' : 'Push prompt disabled on storefront.');
        } catch (e) { setStatus(messageFrom(e)); }
    };

    const removeCampaign = async (id) => {
        if (!confirm('Delete this notification?')) return;
        await api.delete(`/cp/push/notifications/${id}`);
        loadCampaigns();
    };

    const resend = async (id) => {
        if (!confirm('Send this notification to all active subscribers?')) return;
        setStatus('');
        try {
            const { data } = await api.post(`/cp/push/notifications/${id}/send`);
            setStatus(data.message);
            loadCampaigns();
            loadOverview();
        } catch (e) { setStatus(messageFrom(e)); }
    };

    const removeSubscriber = async (id) => {
        if (!confirm('Remove this subscriber?')) return;
        await api.delete(`/cp/push/subscribers/${id}`);
        loadSubscribers();
        loadOverview();
    };

    return <AdminPage title="Push notifications" subtitle="Send browser alerts to customers who opted in." action={<button className="btn" onClick={() => setOpen(true)}><Send /> Compose & send</button>}>
        {status && <div className="save-status">{status}</div>}
        {loading && !overview ? <Loading /> : error ? <ErrorState message={error} retry={refresh} /> : <>
            <div className="stats-grid push-stats">
                <div className="stat-card"><span><Users /></span><div><small>Active subscribers</small><strong>{overview?.subscribers ?? 0}</strong></div></div>
                <div className="stat-card"><span><Bell /></span><div><small>Campaigns sent</small><strong>{overview?.sent_campaigns ?? 0}</strong></div></div>
                <div className="stat-card"><span><KeyRound /></span><div><small>VAPID keys</small><strong>{overview?.configured ? 'Ready' : 'Missing'}</strong></div></div>
                <div className="stat-card"><span><Bell /></span><div><small>Storefront prompt</small><strong>{overview?.enabled ? 'On' : 'Off'}</strong></div></div>
            </div>

            <section className="admin-card" style={{ padding: 20 }}>
                <div className="card-head" style={{ padding: 0, marginBottom: 14 }}>
                    <h2>Setup</h2>
                    <p>Generate keys once, then enable the storefront prompt so visitors can subscribe.</p>
                </div>
                <div className="admin-page-actions">
                    {!overview?.configured && <button type="button" className="btn" onClick={() => generateKeys(false)}><KeyRound /> Generate VAPID keys</button>}
                    {overview?.configured && <button type="button" className="btn btn-outline" onClick={() => generateKeys(true)}><KeyRound /> Regenerate keys</button>}
                    <button type="button" className="btn btn-outline" onClick={toggleEnabled} disabled={!overview?.configured}>
                        {overview?.enabled ? 'Disable storefront prompt' : 'Enable storefront prompt'}
                    </button>
                </div>
                {overview?.public_key && <p className="import-hint" style={{ marginTop: 14 }}>Public key ready. Visitors will see an “Enable notifications” prompt on the website.</p>}
            </section>

            <div className="push-tabs">
                <button type="button" className={tab === 'compose' ? 'active' : ''} onClick={() => { setTab('compose'); setPage(1); }}>Compose</button>
                <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => { setTab('history'); setPage(1); }}>History</button>
                <button type="button" className={tab === 'subscribers' ? 'active' : ''} onClick={() => { setTab('subscribers'); setPage(1); }}>Subscribers</button>
            </div>

            {tab === 'compose' && <section className="admin-card" style={{ padding: 24 }}>
                <ComposeForm onDone={(message) => { setStatus(message); setTab('history'); loadOverview(); loadCampaigns(1); }} />
            </section>}

            {tab === 'history' && <section className="admin-card">
                {!campaigns.items.length ? <Empty title="No notifications yet" /> : <div className="table-wrap"><table><thead><tr><th>Title</th><th>Status</th><th>Sent</th><th>Failed</th><th>Date</th><th>Actions</th></tr></thead><tbody>
                    {campaigns.items.map((item) => <tr key={item.id}>
                        <td><b>{item.title}</b><div className="muted-cell">{item.body}</div></td>
                        <td><span className={`status ${item.status === 'sent' ? 'active' : 'inactive'}`}>{item.status}</span></td>
                        <td>{item.sent_count}</td>
                        <td>{item.fail_count}</td>
                        <td>{item.sent_at ? new Date(item.sent_at).toLocaleString() : '—'}</td>
                        <td><div className="table-actions">
                            <button title="Send again" onClick={() => resend(item.id)}><Send /></button>
                            <button className="danger" title="Delete" onClick={() => removeCampaign(item.id)}><Trash2 /></button>
                        </div></td>
                    </tr>)}
                </tbody></table></div>}
                <Pagination meta={campaigns.meta} onPage={setPage} />
            </section>}

            {tab === 'subscribers' && <section className="admin-card">
                {!subscribers.items.length ? <Empty title="No push subscribers yet" /> : <div className="table-wrap"><table><thead><tr><th>ID</th><th>Browser</th><th>Status</th><th>Subscribed</th><th>Actions</th></tr></thead><tbody>
                    {subscribers.items.map((item) => <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td className="muted-cell">{item.user_agent || 'Unknown browser'}</td>
                        <td><span className={`status ${item.is_active ? 'active' : 'inactive'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                        <td><div className="table-actions"><button className="danger" onClick={() => removeSubscriber(item.id)}><Trash2 /></button></div></td>
                    </tr>)}
                </tbody></table></div>}
                <Pagination meta={subscribers.meta} onPage={setPage} />
            </section>}
        </>}
        <ComposeModal open={open} close={() => setOpen(false)} onDone={(message) => { setOpen(false); setStatus(message); setTab('history'); loadOverview(); loadCampaigns(1); }} />
    </AdminPage>;
}

function ComposeForm({ onDone, compact }) {
    const [values, setValues] = useState({ title: '', body: '', url: '/', image: null });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e, sendNow) => {
        e.preventDefault();
        setBusy(true); setError('');
        try {
            const body = toFormData({ ...values, send_now: sendNow ? 1 : 0 });
            const { data } = await api.post('/cp/push/notifications', body);
            setValues({ title: '', body: '', url: '/', image: null });
            onDone?.(data.message || 'Saved.');
        } catch (err) { setError(messageFrom(err)); }
        finally { setBusy(false); }
    };

    return <form className={`resource-form form-grid ${compact ? '' : ''}`} onSubmit={(e) => submit(e, true)}>
        <label>Title<input required maxLength={120} value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} placeholder="Flash sale on gaming laptops" /></label>
        <label>Click URL<input value={values.url} onChange={(e) => setValues({ ...values, url: e.target.value })} placeholder="/shop" /></label>
        <label className="full">Message<textarea required maxLength={500} rows={4} value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} placeholder="Short message customers will see on their device." /></label>
        <label>Optional image<input type="file" accept="image/*" onChange={(e) => setValues({ ...values, image: e.target.files?.[0] || null })} /></label>
        {error && <p className="form-error full">{error}</p>}
        <div className="modal-actions full">
            <button type="button" className="btn btn-outline" disabled={busy} onClick={(e) => submit(e, false)}>{busy ? 'Saving…' : 'Save draft'}</button>
            <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send to subscribers'}</button>
        </div>
    </form>;
}

function ComposeModal({ open, close, onDone }) {
    return <Modal open={open} onClose={close} title="Compose push notification" wide>
        <ComposeForm compact onDone={onDone} />
    </Modal>;
}
