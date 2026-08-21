import { AlertTriangle, Database, Download, HardDrive, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, messageFrom, toFormData, unwrap } from '../api/client';
import { Loading } from '../components/Common';
import { AdminPage } from './Dashboard';

export default function Backup() {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [dbFile, setDbFile] = useState(null);
    const [storageFile, setStorageFile] = useState(null);
    const [dbConfirm, setDbConfirm] = useState(false);
    const [storageConfirm, setStorageConfirm] = useState(false);
    const [busy, setBusy] = useState('');

    const loadInfo = () => api.get('/cp/backup').then((r) => setInfo(unwrap(r) || {})).finally(() => setLoading(false));

    useEffect(() => { loadInfo(); }, []);

    const downloadFile = async (url, fallbackName) => {
        setBusy('download');
        setStatus('Preparing download…');
        try {
            const response = await fetch(`/api${url}`, {
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
            });
            if (!response.ok) {
                let message = `Download failed (${response.status}).`;
                const type = response.headers.get('content-type') || '';
                if (type.includes('json')) {
                    const data = await response.json();
                    message = data.message || message;
                }
                setStatus(message);
                return;
            }
            const blob = await response.blob();
            const disposition = response.headers.get('content-disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/i);
            const filename = match?.[1] || fallbackName;
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
            setStatus('Download started.');
        } catch (err) {
            setStatus(err?.message || 'Download failed.');
        } finally {
            setBusy('');
        }
    };

    const restoreDatabase = async (e) => {
        e.preventDefault();
        if (!dbFile || !dbConfirm) return;
        setBusy('db-restore');
        setStatus('');
        try {
            const body = toFormData({ backup: dbFile, confirm: '1' });
            const response = await api.post('/cp/backup/database/restore', body);
            setStatus(response.data?.message || 'Database restored successfully.');
            setDbFile(null);
            setDbConfirm(false);
            await loadInfo();
        } catch (err) {
            setStatus(messageFrom(err));
        } finally {
            setBusy('');
        }
    };

    const restoreStorage = async (e) => {
        e.preventDefault();
        if (!storageFile || !storageConfirm) return;
        setBusy('storage-restore');
        setStatus('');
        try {
            const body = toFormData({ backup: storageFile, confirm: '1' });
            const response = await api.post('/cp/backup/storage/restore', body);
            setStatus(response.data?.message || 'Storage restored successfully.');
            setStorageFile(null);
            setStorageConfirm(false);
            await loadInfo();
        } catch (err) {
            setStatus(messageFrom(err));
        } finally {
            setBusy('');
        }
    };

    if (loading) return <AdminPage><Loading /></AdminPage>;

    return (
        <AdminPage
            title="Backup"
            subtitle="Download or restore your database and uploaded storage files."
        >
            <div className="settings-stack">
                <section className="admin-card settings-section">
                    <div>
                        <h2><Database size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} /> Database backup</h2>
                        <p>Export the full database as an SQL file, or restore from a previous backup.</p>
                    </div>
                    <div className="backup-meta">
                        <div><span>Driver</span><strong>{info?.database?.driver || '—'}</strong></div>
                        <div><span>Database</span><strong>{info?.database?.name || '—'}</strong></div>
                        <div><span>Estimated size</span><strong>{info?.database?.size || '—'}</strong></div>
                    </div>
                    <div className="backup-actions">
                        <button type="button" className="btn" disabled={!!busy} onClick={() => downloadFile('/cp/backup/database/download', `database-${new Date().toISOString().slice(0, 10)}.sql`)}>
                            <Download /> {busy === 'download' ? 'Preparing…' : 'Download database (.sql)'}
                        </button>
                    </div>
                    <form className="backup-restore" onSubmit={restoreDatabase}>
                        <label>
                            Restore database from SQL file
                            <input type="file" accept=".sql,.txt,application/sql,text/plain" onChange={(e) => setDbFile(e.target.files?.[0] || null)} />
                        </label>
                        <label className="check backup-warning">
                            <input type="checkbox" checked={dbConfirm} onChange={(e) => setDbConfirm(e.target.checked)} />
                            I understand this will overwrite the current database.
                        </label>
                        <button type="submit" className="btn btn-outline" disabled={!dbFile || !dbConfirm || !!busy}>
                            <Upload /> {busy === 'db-restore' ? 'Restoring…' : 'Upload & restore database'}
                        </button>
                    </form>
                </section>

                <section className="admin-card settings-section">
                    <div>
                        <h2><HardDrive size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: -3 }} /> Storage backup</h2>
                        <p>Download uploaded images and files from <code>storage/app/public</code> as a ZIP archive, or restore from a ZIP upload.</p>
                    </div>
                    <div className="backup-meta">
                        <div><span>Folder</span><strong>{info?.storage?.path || 'storage/app/public'}</strong></div>
                        <div><span>Files</span><strong>{info?.storage?.files ?? 0}</strong></div>
                        <div><span>Estimated size</span><strong>{info?.storage?.size || '—'}</strong></div>
                    </div>
                    <div className="backup-actions">
                        <button type="button" className="btn" disabled={!!busy} onClick={() => downloadFile('/cp/backup/storage/download', `storage-${new Date().toISOString().slice(0, 10)}.zip`)}>
                            <Download /> {busy === 'download' ? 'Preparing…' : 'Download storage (.zip)'}
                        </button>
                    </div>
                    <form className="backup-restore" onSubmit={restoreStorage}>
                        <label>
                            Restore storage from ZIP file
                            <input type="file" accept=".zip,application/zip" onChange={(e) => setStorageFile(e.target.files?.[0] || null)} />
                        </label>
                        <label className="check backup-warning">
                            <input type="checkbox" checked={storageConfirm} onChange={(e) => setStorageConfirm(e.target.checked)} />
                            I understand this will merge uploaded files into the current storage folder.
                        </label>
                        <button type="submit" className="btn btn-outline" disabled={!storageFile || !storageConfirm || !!busy}>
                            <Upload /> {busy === 'storage-restore' ? 'Restoring…' : 'Upload & restore storage'}
                        </button>
                    </form>
                </section>

                <div className="backup-note">
                    <AlertTriangle size={16} />
                    <p>Restore actions replace existing data. Always download a fresh backup before restoring. Large uploads may take a few minutes.</p>
                </div>

                {status && <div className="save-status">{status}</div>}
            </div>
        </AdminPage>
    );
}
