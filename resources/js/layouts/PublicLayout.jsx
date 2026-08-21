import { ChevronDown, Globe, Mail, Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer';
import PushPrompt from '../components/PushPrompt';
import SearchAutocomplete from '../components/SearchAutocomplete';
import { asset } from '../components/Common';
import { useCart, useStore } from '../contexts/StoreContext';

const serviceLinks = [
    ['Annual maintenance contracts (AMC)', '/page/annual-maintenance-contracts'],
    ['Networking services', '/page/networking-services'],
];

const laptopCategoryNames = ['New Laptops', 'Gaming Laptops', 'Used Laptops'];
const topCategoryNames = ['Mobile Phones', 'Network Equipment', 'Accessories'];

function matchCategory(categories, name) {
    const needle = name.toLowerCase();
    return categories.find((c) => String(c.name || '').toLowerCase() === needle)
        || categories.find((c) => String(c.slug || '').toLowerCase().includes(needle.replace(/\s+/g, '-')));
}

function categoryHref(item) {
    return `/shop?category=${item.slug || item.id}`;
}

function NavDropdown({ label, open, setOpen, active, links, current, onNavigate }) {
    const ref = useRef(null);

    useEffect(() => {
        const onPointer = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', onPointer);
        return () => document.removeEventListener('pointerdown', onPointer);
    }, [setOpen]);

    if (!links.length) return null;

    return (
        <div className={`nav-dropdown ${open ? 'open' : ''} ${active ? 'active' : ''}`} ref={ref}>
            <button type="button" className="nav-dropdown-toggle" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
                {label} <ChevronDown />
            </button>
            <div className="nav-dropdown-menu" role="menu">
                {links.map(([itemLabel, path]) => (
                    <Link key={path} to={path} role="menuitem" className={current === path ? 'active' : ''} onClick={onNavigate}>{itemLabel}</Link>
                ))}
            </div>
        </div>
    );
}

export default function PublicLayout() {
    const store = useStore(), cart = useCart(), settings = store.settings || {};
    const categories = store.categories || [];
    const [menu, setMenu] = useState(false), [search, setSearch] = useState('');
    const [laptopsOpen, setLaptopsOpen] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const current = `${location.pathname}${location.search}`;

    const laptopLinks = laptopCategoryNames
        .map((name) => matchCategory(categories, name))
        .filter(Boolean)
        .map((item) => [item.name, categoryHref(item)]);

    const topCategoryLinks = topCategoryNames
        .map((name) => matchCategory(categories, name))
        .filter(Boolean);

    const closeMenu = () => { setMenu(false); setLaptopsOpen(false); setServicesOpen(false); };
    const submit = (e) => { e.preventDefault(); if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search.trim())}`); closeMenu(); };
    const socials = ['facebook', 'instagram', 'youtube'];
    const servicesActive = serviceLinks.some(([, path]) => location.pathname === path);
    const laptopsActive = laptopLinks.some(([, path]) => current === path);

    useEffect(() => { setLaptopsOpen(false); setServicesOpen(false); setMenu(false); }, [location.pathname, location.search]);

    const shopFooterLinks = [
        ...laptopLinks,
        ...topCategoryLinks.map((c) => [c.name, categoryHref(c)]),
    ];

    return <div className="site">
        <div className="announcement"><span>{settings.announcement || 'Shop smarter. Nationwide delivery. Pay on delivery.'}</span><Link to="/contact">Need help? {settings.phone}</Link></div>
        <header className="header">
            <div className="header-main shell">
                <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X /> : <Menu />}</button>
                <Link className="logo" to="/">{settings.logo ? <img src={asset(settings.logo)} alt={settings.site_name} /> : <><span>N</span><b>{settings.site_name || 'Nexify'}</b></>}</Link>
                <SearchAutocomplete
                    className="header-search-wrap"
                    inputId="site-search"
                    value={search}
                    onChange={setSearch}
                    onSubmit={submit}
                    placeholder="Search laptops, accessories, components…"
                />
                <button className="cart-button" onClick={() => cart.setDrawerOpen(true)}><ShoppingBag /><span>Cart</span><b>{cart.count}</b></button>
            </div>
            <nav className={`nav ${menu ? 'open' : ''}`}><div className="shell nav-inner">
                <div className="nav-links">
                    <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
                    <NavLink to="/shop" onClick={closeMenu}>Shop all</NavLink>
                    <NavDropdown
                        label="Laptops"
                        open={laptopsOpen}
                        setOpen={setLaptopsOpen}
                        active={laptopsActive}
                        links={laptopLinks}
                        current={current}
                        onNavigate={closeMenu}
                    />
                    {topCategoryLinks.map((item) => {
                        const href = categoryHref(item);
                        return (
                            <Link key={item.id || item.slug} to={href} className={current === href ? 'active' : ''} onClick={closeMenu}>
                                {item.name}
                            </Link>
                        );
                    })}
                    <NavDropdown
                        label="Services"
                        open={servicesOpen}
                        setOpen={setServicesOpen}
                        active={servicesActive}
                        links={serviceLinks}
                        current={location.pathname}
                        onNavigate={closeMenu}
                    />
                    <NavLink to="/blog" onClick={closeMenu}>Guides</NavLink>
                    <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
                </div>
                <SearchAutocomplete value={search} onChange={setSearch} onSubmit={submit} placeholder="Search products" mobile />
            </div></nav>
        </header>
        <main><Outlet /></main>
        <footer className="footer">
            <div className="shell footer-grid">
                <div><Link className="logo footer-logo" to="/"><span>N</span><b>{settings.site_name || 'Nexify'}</b></Link><p>{settings.footer_text || 'Technology made simple, reliable and accessible — delivered across Pakistan.'}</p><div className="socials">{socials.map((key) => settings[key] && <a key={key} href={settings[key]} aria-label={key}><Globe /></a>)}</div></div>
                <div>
                    <h3>Shop</h3>
                    <Link to="/shop">All products</Link>
                    {shopFooterLinks.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}
                </div>
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
