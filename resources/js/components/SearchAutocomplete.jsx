import { LoaderCircle, Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, listFrom } from '../api/client';
import { Media, money } from './Common';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function highlightMatch(text, query) {
    if (!query?.trim()) return text;
    const terms = query.trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return text;
    const regex = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi');
    return text.split(regex).filter((part) => part !== '').map((part, index) => {
        const matched = terms.some((term) => part.toLowerCase() === term.toLowerCase());
        return matched ? <strong key={index}>{part}</strong> : part;
    });
}

export default function SearchAutocomplete({ value, onChange, onSubmit, className = '', inputId, placeholder = 'Search products', mobile = false }) {
    const fallbackId = useId();
    const id = inputId || fallbackId;
    const rootRef = useRef(null);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);

    const query = value.trim();
    const showDropdown = open && query.length > 0;

    useEffect(() => {
        if (query.length < 1) {
            setResults([]);
            setLoading(false);
            setActiveIndex(-1);
            return undefined;
        }

        setLoading(true);
        const timer = window.setTimeout(() => {
            api.get('/products/suggest', { params: { q: query } })
                .then((response) => setResults(listFrom(response).items))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 280);

        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const onPointer = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', onPointer);
        return () => document.removeEventListener('pointerdown', onPointer);
    }, []);

    const close = () => {
        setOpen(false);
        setActiveIndex(-1);
    };

    const pick = (slug) => {
        close();
        onChange('');
    };

    const handleKeyDown = (event) => {
        if (!showDropdown) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, -1));
        } else if (event.key === 'Escape') {
            close();
        } else if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
            event.preventDefault();
            navigate(`/product/${results[activeIndex].slug}`);
            pick(results[activeIndex].slug);
        }
    };

    return (
        <div className={`search-autocomplete ${className}`.trim()} ref={rootRef}>
            <form
                className={`${mobile ? 'mobile-search' : 'header-search'}${showDropdown ? ' search-open' : ''}`}
                onSubmit={(event) => { onSubmit(event); close(); }}
            >
                {!mobile && <label className="sr-only" htmlFor={id}>Search products</label>}
                <input
                    id={id}
                    value={value}
                    onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(-1); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls={`${id}-listbox`}
                    aria-autocomplete="list"
                />
                <button type="submit" aria-label="Search"><Search /></button>
            </form>
            {showDropdown && (
                <div className="search-dropdown" id={`${id}-listbox`} role="listbox">
                    {loading && (
                        <div className="search-dropdown-state">
                            <LoaderCircle className="spin" />
                            <span>Searching…</span>
                        </div>
                    )}
                    {!loading && results.length === 0 && (
                        <div className="search-dropdown-state">No products found for “{query}”</div>
                    )}
                    {!loading && results.map((product, index) => (
                        <Link
                            key={product.id}
                            to={`/product/${product.slug}`}
                            className={`search-dropdown-item${index === activeIndex ? ' active' : ''}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => pick(product.slug)}
                        >
                            <Media src={product.image_url} alt={product.name} className="search-dropdown-thumb" />
                            <span className="search-dropdown-copy">
                                <span className="search-dropdown-title">{highlightMatch(product.name, query)}</span>
                                <span className="search-dropdown-price">{money(product.effective_price)}</span>
                            </span>
                        </Link>
                    ))}
                    {!loading && results.length > 0 && (
                        <Link to={`/shop?q=${encodeURIComponent(query)}`} className="search-dropdown-all" onClick={close}>
                            View all results for “{query}”
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
