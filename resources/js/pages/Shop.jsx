import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, listFrom, messageFrom } from '../api/client';
import { Empty, ErrorState, Loading, Pagination } from '../components/Common';
import ProductCard from '../components/ProductCard';
import { useStore } from '../contexts/StoreContext';

export default function Shop() {
    const store = useStore(), [params, setParams] = useSearchParams();
    const [result, setResult] = useState({ items: [], meta: {} }), [loading, setLoading] = useState(true), [error, setError] = useState(''), [filters, setFilters] = useState(false);
    const query = params.toString();
    useEffect(() => {
        setLoading(true); setError('');
        api.get(`/products?${query}`).then((r) => setResult(listFrom(r))).catch((e) => setError(messageFrom(e))).finally(() => setLoading(false));
    }, [query]);
    const set = (key, value) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); if (key !== 'page') next.delete('page'); setParams(next); };
    return <div className="page shell">
        <div className="page-title"><span className="eyebrow">Nexify collection</span><h1>Find your next upgrade</h1><p>Compare practical, reliable technology for work, play and everything between.</p></div>
        <div className="shop-toolbar"><form onSubmit={(e) => e.preventDefault()}><Search /><input aria-label="Search products" value={params.get('q') || ''} onChange={(e) => set('q', e.target.value)} placeholder="Search the collection" /></form><button className="filter-toggle" onClick={() => setFilters(!filters)}><Filter /> Filters</button><select aria-label="Sort products" value={params.get('sort') || 'latest'} onChange={(e) => set('sort', e.target.value)}><option value="latest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name">Name A–Z</option></select></div>
        <div className="shop-layout">
            <aside className={`filters ${filters ? 'open' : ''}`}><div className="filter-head"><h2><SlidersHorizontal /> Filters</h2><button onClick={() => setFilters(false)}><X /></button></div>
                <label>Category<select value={params.get('category') || ''} onChange={(e) => set('category', e.target.value)}><option value="">All categories</option>{store.categories.map((x) => <option key={x.id} value={x.slug || x.id}>{x.name}</option>)}</select></label>
                <label>Brand<select value={params.get('brand') || ''} onChange={(e) => set('brand', e.target.value)}><option value="">All brands</option>{store.brands.map((x) => <option key={x.id} value={x.slug || x.id}>{x.name}</option>)}</select></label>
                <div className="price-filter"><label>Minimum price<input type="number" value={params.get('min_price') || ''} onChange={(e) => set('min_price', e.target.value)} /></label><label>Maximum price<input type="number" value={params.get('max_price') || ''} onChange={(e) => set('max_price', e.target.value)} /></label></div>
                <label className="check"><input type="checkbox" checked={params.get('sale') === '1'} onChange={(e) => set('sale', e.target.checked ? '1' : '')} /> On sale</label>
                <button className="btn btn-outline btn-block" onClick={() => setParams({})}>Clear filters</button>
            </aside>
            <section className="shop-results"><div className="result-count"><b>{result.meta?.total ?? result.items.length}</b> products found</div>
                {loading ? <Loading label="Finding products" /> : error ? <ErrorState message={error} /> : !result.items.length ? <Empty title="No matching products" text="Try changing or clearing your filters." /> : <><div className="product-grid">{result.items.map((p) => <ProductCard key={p.id} product={p} />)}</div><Pagination meta={result.meta} onPage={(p) => set('page', p)} /></>}
            </section>
        </div>
    </div>;
}
