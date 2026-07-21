import { ChevronDown, Globe, Mail, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer';
import PushPrompt from '../components/PushPrompt';
import { asset } from '../components/Common';
import { useCart, useStore } from '../contexts/StoreContext';

const serviceLinks = [
    ['Annual maintenance contracts (AMC)', '/page/annual-maintenance-contracts'],
    ['Networking services', '/page/networking-services'],
];

export default function PublicLayout() {
    const store = useStore(), cart = useCart(), settings = store.settings || {};
    const [menu, setMenu] = useState(false), [search, setSearch] = useState('');
    const [servicesOpen, setServicesOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const servicesRef = useRef(null);

    const closeMenu = () => { setMenu(false); setServicesOpen(false); };
    const submit = (e) => { e.preventDefault(); if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search.trim())}`); closeMenu(); };
    const socials = ['facebook', 'instagram', 'youtube'];
    const servicesActive = serviceLinks.some(([, path]) => location.pathname === path);

    useEffect(() => { setServicesOpen(false); setMenu(false); }, [location.pathname]);

    useEffect(() => {
        const onPointer = (e) => {
            if (servicesRef.current && !servicesRef.current.contains(e.target)) setServicesOpen(false);
        };
        document.addEventListener('pointerdown', onPointer);
        return () => document.removeEventListener('pointerdown', onPointer);
    }, []);

    return <div className="site">
        <div className="announcement"><span>{settings.announcement || 'Shop smarter. Nationwide delivery. Pay on delivery.'}</span><Link to="/contact">Need help? {settings.phone}</Link></div>
        <header className="header">
            <div className="header-main shell">
                <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X /> : <Menu />}</button>
                <Link className="logo" to="/">{settings.logo ? <img src={asset(settings.logo)} alt={settings.site_name} /> : <><span>N</span><b>{settings.site_name || 'Nexify'}</b></>}</Link>
                <form className="header-search" onSubmit={submit}><label className="sr-only" htmlFor="site-search">Search products</label><input id="site-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search laptops, accessories, components…" /><button aria-label="Search"><Search /></button></form>
                <button className="cart-button" onClick={() => cart.setDrawerOpen(true)}><ShoppingBag /><span>Cart</span><b>{cart.count}</b></button>
            </div>
            <nav className={`nav ${menu ? 'open' : ''}`}><div className="shell nav-inner">
                <div className="nav-links">
                    <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
                    <NavLink to="/shop" onClick={closeMenu}>Shop all</NavLink>
                    {store.categories.slice(0, 4).map((item) => <Link key={item.id || item.slug} to={`/shop?category=${item.slug || item.id}`} onClick={closeMenu}>{item.name}</Link>)}
                    <div className={`nav-dropdown ${servicesOpen ? 'open' : ''} ${servicesActive ? 'active' : ''}`} ref={servicesRef}>
                        <button type="button" className="nav-dropdown-toggle" aria-expanded={servicesOpen} aria-haspopup="true" onClick={() => setServicesOpen((v) => !v)}>
                            Services <ChevronDown />
                        </button>
                        <div className="nav-dropdown-menu" role="menu">
                            {serviceLinks.map(([label, path]) => (
                                <Link key={path} to={path} role="menuitem" className={location.pathname === path ? 'active' : ''} onClick={closeMenu}>{label}</Link>
                            ))}
                        </div>
                    </div>
                    <NavLink to="/blog" onClick={closeMenu}>Guides</NavLink>
                    <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
                </div>
                <form className="mobile-search" onSubmit={submit}><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" /><button><Search /></button></form>
            </div></nav>
        </header>
        <main><Outlet /></main>
        <footer className="footer">
            <div className="shell footer-grid">
                <div><Link className="logo footer-logo" to="/"><span>N</span><b>{settings.site_name || 'Nexify'}</b></Link><p>{settings.footer_text || 'Technology made simple, reliable and accessible — delivered across Pakistan.'}</p><div className="socials">{socials.map((key) => settings[key] && <a key={key} href={settings[key]} aria-label={key}><Globe /></a>)}</div></div>
                <div><h3>Shop</h3><Link to="/shop">All products</Link>{store.categories.slice(0, 4).map((c) => <Link key={c.id || c.slug} to={`/shop?category=${c.slug || c.id}`}>{c.name}</Link>)}</div>
                <div><h3>Services</h3><Link to="/page/annual-maintenance-contracts">Annual maintenance contracts (AMC)</Link><Link to="/page/networking-services">Networking services</Link></div>
                <div><h3>Company</h3><Link to="/about">About us</Link><Link to="/blog">Buying guides</Link><Link to="/contact">Contact</Link><Link to="/page/privacy-policy">Privacy policy</Link></div>
                <div><h3>Stay connected</h3><p>{settings.address}</p><a href={`mailto:${settings.email}`}><Mail /> {settings.email}</a><a href={`https://wa.me/${String(settings.whatsapp || '').replace(/\D/g, '')}`}><img className="whatsapp-inline" src="/whatsapp.svg" alt="" /> WhatsApp support</a></div>
            </div>
            <div className="footer-bottom shell"><span>© {new Date().getFullYear()} {settings.site_name || 'Nexify'}. All rights reserved.</span><span>Cash on Delivery • Secure ordering</span></div>
        </footer>
        {settings.whatsapp && <a className="whatsapp" href={`https://wa.me/${String(settings.whatsapp).replace(/\D/g, '')}`} aria-label="Chat on WhatsApp"><img src="/whatsapp.svg" alt="" /></a>}
        <PushPrompt />
        <CartDrawer />
    </div>;
}
