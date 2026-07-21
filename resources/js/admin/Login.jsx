import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { messageFrom } from '../api/client';
import { asset } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';

export default function Login() {
    const { user, loading, login } = useAuth(), [form, setForm] = useState({ email: '', password: '', remember: false }), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const settings = useStore().settings || {};
    const navigate = useNavigate(), location = useLocation();
    if (!loading && user) return <Navigate to="/cp" replace />;
    const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await login(form); navigate(location.state?.from?.pathname || '/cp', { replace: true }); } catch (err) { setError(messageFrom(err)); setBusy(false); } };
    const logo = asset(settings.logo || '/nexify-logo.png');
    return <div className="login-page"><div className="login-art"><Link className="login-brand-logo" to="/"><img src={logo} alt={settings.site_name || 'Nexify System'} /></Link><div><span className="eyebrow">Nexify control panel</span><h1>Run your store with clarity.</h1><p>Products, orders, content and storefront controls — all in one focused workspace.</p></div><small>Secure administrative access</small></div><main className="login-form"><Link to="/" className="back-link"><ArrowLeft /> Storefront</Link><Link className="login-mobile-logo" to="/"><img src={logo} alt={settings.site_name || 'Nexify System'} /></Link><form onSubmit={submit}><div className="login-icon"><LockKeyhole /></div><h2>Welcome back</h2><p>Sign in to manage Nexify.</p><label>Email address<input required autoComplete="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input required autoComplete="current-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><label className="check"><input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} /> Keep me signed in</label>{error && <p className="form-error">{error}</p>}<button className="btn btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form></main></div>;
}
