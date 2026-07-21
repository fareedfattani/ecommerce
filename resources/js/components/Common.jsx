import { AlertCircle, ChevronLeft, ChevronRight, Image, LoaderCircle, PackageOpen, X } from 'lucide-react';

export const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-PK')}`;
export const asset = (path) => !path ? '' : path.startsWith('http') || path.startsWith('/') ? path : `/storage/${path}`;
export const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '');

export function Media({ src, alt = '', className = '' }) {
    return src ? <img src={asset(src)} alt={alt} className={className} loading="lazy" /> :
        <div className={`media-placeholder ${className}`} role="img" aria-label={`${alt || 'Product'} image placeholder`}><Image size={34} /></div>;
}

export function Loading({ label = 'Loading' }) {
    return <div className="state-box"><LoaderCircle className="spin" /><p>{label}…</p></div>;
}

export function Empty({ title = 'Nothing here yet', text = 'Please check back soon.' }) {
    return <div className="state-box"><PackageOpen /><h3>{title}</h3><p>{text}</p></div>;
}

export function ErrorState({ message, retry }) {
    return <div className="state-box error"><AlertCircle /><h3>We hit a snag</h3><p>{message}</p>{retry && <button className="btn" onClick={retry}>Try again</button>}</div>;
}

export function Modal({ open, onClose, title, children, wide = false }) {
    if (!open) return null;
    return <div className="modal-backdrop" onMouseDown={onClose}>
        <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></div>
            {children}
        </section>
    </div>;
}

export function Pagination({ meta, onPage }) {
    const current = Number(meta?.current_page || 1), last = Number(meta?.last_page || 1);
    if (last <= 1) return null;
    return <nav className="pagination" aria-label="Pagination">
        <button disabled={current <= 1} onClick={() => onPage(current - 1)}><ChevronLeft /> Previous</button>
        <span>Page {current} of {last}</span>
        <button disabled={current >= last} onClick={() => onPage(current + 1)}>Next <ChevronRight /></button>
    </nav>;
}

export function SectionTitle({ eyebrow, title, text, action }) {
    return <div className="section-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div>;
}
