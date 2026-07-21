import { Download, Eye, FileSpreadsheet, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, listFrom, messageFrom, unwrap } from '../api/client';
import { Empty, ErrorState, Loading, Modal, Pagination } from '../components/Common';
import { AdminPage } from './Dashboard';

const STATUSES = ['new', 'in_progress', 'quoted', 'closed'];

export default function QuoteRequests() {
    const [result, setResult] = useState({ items: [], meta: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);

    const load = () => {
        setLoading(true);
        setError('');
        api.get('/cp/quote-requests', { params: { search, status, page } })
            .then((r) => setResult(listFrom(r)))
            .catch((e) => setError(messageFrom(e)))
            .finally(() => setLoading(false));
    };

    useEffect(load, [page, status]);

    const openDetail = async (id) => {
        try {
            const data = unwrap(await api.get(`/cp/quote-requests/${id}`));
            setSelected(data.quote || data);
        } catch (e) {
            alert(messageFrom(e));
        }
    };

    const saveDetail = async (payload) => {
        const data = unwrap(await api.patch(`/cp/quote-requests/${selected.id}`, payload));
        setSelected(data.data || data.quote || data);
        load();
    };

    const downloadExcel = async () => {
        try {
            const response = await api.get('/cp/quote-requests/export', {
                params: { search: search || undefined, status: status || undefined },
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `quote-requests-${new Date().toISOString().slice(0, 10)}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert(messageFrom(e) || 'Export failed.');
        }
    };

    return (
        <AdminPage
            title="Quote requests"
            subtitle="Corporate quotation submissions from the Contact page."
            action={<button type="button" className="btn btn-outline" onClick={downloadExcel}><Download /> Export Excel</button>}
        >
            <section className="admin-card">
                <div className="resource-toolbar quote-toolbar">
                    <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}>
                        <Search />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, person, email, phone…" />
                    </form>
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    <button type="button" className="btn btn-outline" onClick={downloadExcel}><FileSpreadsheet /> Excel</button>
                </div>

                {loading ? <Loading /> : error ? <ErrorState message={error} retry={load} /> : !result.items.length ? <Empty title="No quote requests yet" /> : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Company</th>
                                    <th>Contact</th>
                                    <th>Requirement</th>
                                    <th>City</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                                        <td><b>{item.company_name}</b></td>
                                        <td>{item.contact_person}<br /><small>{item.phone}</small></td>
                                        <td>{item.requirement_type}</td>
                                        <td>{item.delivery_city || '—'}</td>
                                        <td><span className={`status ${item.status === 'new' ? 'active' : 'inactive'}`}>{item.status?.replace('_', ' ')}</span></td>
                                        <td><div className="table-actions"><button type="button" onClick={() => openDetail(item.id)} title="View"><Eye /></button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination meta={result.meta} onPage={setPage} />
            </section>

            <QuoteDetailModal quote={selected} onClose={() => setSelected(null)} onSave={saveDetail} />
        </AdminPage>
    );
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function QuoteDetailModal({ quote, onClose, onSave }) {
    const [status, setStatus] = useState('new');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!quote) return;
        setStatus(quote.status || 'new');
        setNotes(quote.admin_notes || '');
        setError('');
    }, [quote]);

    if (!quote) return null;

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await onSave({ status, admin_notes: notes });
        } catch (err) {
            setError(messageFrom(err));
        } finally {
            setBusy(false);
        }
    };

    const list = (items) => (items?.length ? items.join(', ') : '—');

    return (
        <Modal open onClose={onClose} title={`Quote #${quote.id} — ${quote.company_name}`} wide>
            <form className="quote-detail" onSubmit={save}>
                <div className="quote-detail-grid">
                    <div className="quote-detail-main">
                        <section className="quote-card">
                            <h3>Company</h3>
                            <dl className="quote-fields">
                                <div><dt>Company name</dt><dd>{quote.company_name}</dd></div>
                                <div><dt>Contact person</dt><dd>{quote.contact_person}</dd></div>
                                <div><dt>Designation</dt><dd>{quote.designation || '—'}</dd></div>
                                <div><dt>Email</dt><dd>{quote.email}</dd></div>
                                <div><dt>Phone</dt><dd>{quote.phone}</dd></div>
                                <div><dt>Website</dt><dd>{quote.website || '—'}</dd></div>
                                <div className="full"><dt>Business address</dt><dd>{quote.business_address || '—'}</dd></div>
                            </dl>
                        </section>

                        <section className="quote-card">
                            <h3>Requirement</h3>
                            <dl className="quote-fields">
                                <div><dt>Type</dt><dd>{quote.requirement_type}</dd></div>
                                <div><dt>Quantity</dt><dd>{quote.quantity}</dd></div>
                                <div><dt>Budget</dt><dd>{quote.budget_range || '—'}</dd></div>
                                <div className="full"><dt>Preferred brands</dt><dd>{list(quote.preferred_brands)}</dd></div>
                                <div className="full"><dt>Preferred specs</dt><dd className="multiline">{quote.preferred_specs || '—'}</dd></div>
                                {(quote.networking_requirements?.length > 0) && <div className="full"><dt>Networking</dt><dd>{list(quote.networking_requirements)}</dd></div>}
                                {(quote.service_requirements?.length > 0) && <div className="full"><dt>Services</dt><dd>{list(quote.service_requirements)}</dd></div>}
                            </dl>
                        </section>

                        <section className="quote-card">
                            <h3>Project details</h3>
                            <p className="quote-block">{quote.project_details || '—'}</p>
                        </section>

                        <section className="quote-card">
                            <h3>Delivery</h3>
                            <dl className="quote-fields">
                                <div><dt>City</dt><dd>{quote.delivery_city || '—'}</dd></div>
                                <div><dt>Expected date</dt><dd>{formatDate(quote.expected_delivery_date)}</dd></div>
                                <div><dt>Preferred contact</dt><dd>{quote.preferred_contact || '—'}</dd></div>
                                <div><dt>Submitted</dt><dd>{formatDateTime(quote.created_at)}</dd></div>
                            </dl>
                            {(quote.attachment_urls?.length > 0) && (
                                <ul className="quote-files">
                                    {quote.attachment_urls.map((file) => <li key={file.path}><a href={file.url} target="_blank" rel="noreferrer">{file.name}</a></li>)}
                                </ul>
                            )}
                        </section>
                    </div>

                    <aside className="quote-detail-aside">
                        <label className="quote-aside-field">
                            <span>Status</span>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                        </label>
                        <label className="quote-aside-field">
                            <span>Admin notes</span>
                            <textarea rows="10" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal follow-up notes…" />
                        </label>
                        {error && <p className="form-error">{error}</p>}
                        <div className="modal-actions">
                            <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
                            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
                        </div>
                    </aside>
                </div>
            </form>
        </Modal>
    );
}
