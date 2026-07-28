import { Archive, BarChart3, Bell, BookOpen, ChevronLeft, ClipboardList, FileText, HelpCircle, Image, Layers3, LogOut, Menu, MessageSquareQuote, Package, PanelsTopLeft, Settings, ShoppingCart, Tags, TicketPercent, Truck, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from '../components/Common';
import { useAuth } from '../contexts/AuthContext';

const links = [
    ['Dashboard', '/cp', BarChart3, true], ['Products', '/cp/products', Package], ['Categories', '/cp/categories', Layers3],
    ['Brands', '/cp/brands', Tags], ['Orders', '/cp/orders', ShoppingCart], ['Quote requests', '/cp/quote-requests', ClipboardList], ['Delivery charges', '/cp/delivery-charges', Truck], ['Coupons', '/cp/coupons', TicketPercent], ['Posts', '/cp/posts', BookOpen],
    ['Pages', '/cp/pages', FileText], ['Banners', '/cp/banners', Image], ['FAQs', '/cp/faqs', HelpCircle],
    ['Testimonials', '/cp/testimonials', MessageSquareQuote], ['Subscribers', '/cp/subscribers', Users],
    ['Push alerts', '/cp/push-notifications', Bell], ['Settings', '/cp/settings', Settings], ['Backup', '/cp/backup', Archive],
];

export function ProtectedAdmin() {
    const { user, loading, logout } = useAuth(), [open, setOpen] = useState(false), location = useLocation();
    if (loading) return <Loading label="Checking access" />;
    if (!user) return <Navigate to="/cp/login" state={{ from: location }} replace />;
    return <div className="admin-shell">
        {open && <button className="admin-overlay" onClick={() => setOpen(false)} aria-label="Close sidebar" />}
        <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
            <div className="admin-brand"><Link to="/cp"><span>N</span><b>Nexify</b><small>Control panel</small></Link><button onClick={() => setOpen(false)}><X /></button></div>
            <nav>{links.map(([label, to, Icon, end]) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}><Icon /> {label}</NavLink>)}</nav>
            <div className="admin-side-foot"><Link to="/" target="_blank"><ChevronLeft /> View storefront</Link><button onClick={logout}><LogOut /> Sign out</button></div>
        </aside>
        <div className="admin-main"><header className="admin-topbar"><button className="icon-btn" onClick={() => setOpen(true)}><Menu /></button><div><PanelsTopLeft /><span>Control panel</span></div><div className="admin-user"><span>{user.name?.[0] || 'A'}</span><p><b>{user.name || 'Administrator'}</b><small>{user.email}</small></p></div></header><Outlet /></div>
    </div>;
}
