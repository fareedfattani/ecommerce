import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, messageFrom, toFormData, unwrap } from '../api/client';
import { Loading } from '../components/Common';
import { AdminPage } from './Dashboard';

const sections = [
    ['Brand & theme', [['site_name', 'Site name'], ['logo', 'Logo', 'file'], ['favicon', 'Favicon', 'file'], ['primary_color', 'Primary color', 'color'], ['secondary_color', 'Accent color', 'color'], ['dark_color', 'Dark/navy color', 'color']]],
    ['Business details', [['phone', 'Phone'], ['email', 'Email', 'email'], ['address', 'Address', 'textarea'], ['whatsapp', 'WhatsApp number'], ['facebook', 'Facebook URL', 'url'], ['instagram', 'Instagram URL', 'url'], ['youtube', 'YouTube URL', 'url']]],
    ['Homepage & footer', [['announcement', 'Announcement text', 'textarea'], ['hero_title', 'Hero title'], ['hero_subtitle', 'Hero subtitle', 'textarea'], ['footer_text', 'Footer text', 'textarea'], ['newsletter_title', 'Newsletter title']]],
    ['SEO & indexing', [['meta_title', 'Default SEO title'], ['meta_description', 'Default SEO description', 'textarea'], ['robots', 'Robots directives'], ['google_analytics_id', 'Google Analytics ID (e.g. G-XXXXXXXX)']]],
];

export default function Settings() {
    const [values, setValues] = useState({}), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
    useEffect(() => { api.get('/cp/settings').then((r) => setValues(unwrap(r) || {})).finally(() => setLoading(false)); }, []);
    const save = async (e) => {
        e.preventDefault(); setBusy(true); setStatus('');
        try {
            const { product_addons: _ignore, logo, favicon, ...rest } = values;
            const payload = { ...rest, _method: 'PUT' };
            // Only send image fields when a new file was chosen (not the existing URL string)
            if (logo instanceof File) payload.logo = logo;
            if (favicon instanceof File) payload.favicon = favicon;
            // Empty social URLs should not fail "url" validation
            ['facebook', 'instagram', 'youtube'].forEach((key) => {
                if (!payload[key]) delete payload[key];
            });
            const body = toFormData(payload);
            const saved = unwrap(await api.post('/cp/settings', body)) || {};
            setValues((current) => ({
                ...current,
                ...saved,
                // keep newly selected files cleared; use saved URLs from server
                logo: saved.logo ?? current.logo,
                favicon: saved.favicon ?? current.favicon,
            }));
            setStatus('Settings saved successfully.');
        } catch (err) {
            setStatus(messageFrom(err));
        } finally {
            setBusy(false);
        }
    };
    if (loading) return <AdminPage><Loading /></AdminPage>;
    return <AdminPage title="Store settings" subtitle="Control the storefront identity, content and discoverability." action={<button form="settings-form" className="btn" disabled={busy}><Save /> {busy ? 'Saving…' : 'Save settings'}</button>}><form id="settings-form" onSubmit={save} className="settings-stack">{sections.map(([title, fields]) => <section className="admin-card settings-section" key={title}><div><h2>{title}</h2><p>Update {title.toLowerCase()} preferences.</p></div><div className="form-grid">{fields.map(([key, label, type = 'text']) => <SettingField key={key} name={key} label={label} type={type} value={values[key] ?? ''} onChange={(value) => setValues({ ...values, [key]: value })} />)}</div></section>)}{status && <div className="save-status">{status}</div>}</form></AdminPage>;
}

function SettingField({ name, label, type, value, onChange }) {
    if (type === 'textarea') return <label className="full">{label}<textarea rows="3" value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
    if (type === 'file') {
        const preview = value instanceof File ? URL.createObjectURL(value) : (typeof value === 'string' ? value : '');
        return (
            <label className="settings-file-field">
                {label}
                {preview && <span className="settings-file-preview"><img src={preview} alt="" /></span>}
                <input type="file" accept="image/*,.ico" onChange={(e) => onChange(e.target.files?.[0] || null)} />
                {typeof value === 'string' && value && <small>Current: {value.split('/').pop()}</small>}
                {value instanceof File && <small>Selected: {value.name}</small>}
            </label>
        );
    }
    return <label>{label}<input name={name} type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
}
