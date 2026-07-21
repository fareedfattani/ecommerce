import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, messageFrom, unwrap } from '../api/client';
import { ErrorState, Loading, Media, SectionTitle, money } from '../components/Common';
import ProductCard from '../components/ProductCard';
import { useCart, useStore } from '../contexts/StoreContext';
import { DEFAULT_ADDONS, addonExtra, addonSummary, normalizeAddons, productAllowsAddons, resolveAddonGroups } from '../data/addons';

export default function ProductDetail() {
    const { slug } = useParams(), cart = useCart(), store = useStore();
    const [product, setProduct] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1), [active, setActive] = useState(0);
    const [addons, setAddons] = useState(DEFAULT_ADDONS);
    const catalog = useMemo(() => resolveAddonGroups(store.settings?.product_addons || cart.catalog), [store.settings?.product_addons, cart.catalog]);

    useEffect(() => {
        setLoading(true); window.scrollTo(0, 0); setAddons(DEFAULT_ADDONS); setQuantity(1); setActive(0);
        api.get(`/products/${slug}`).then((r) => {
            const payload = unwrap(r);
            setProduct({ ...payload.product, related_products: payload.related || [] });
        }).catch((e) => setError(messageFrom(e))).finally(() => setLoading(false));
    }, [slug]);

    const allowsAddons = productAllowsAddons(product);
    const selected = useMemo(() => (allowsAddons ? normalizeAddons(addons, catalog) : null), [addons, catalog, allowsAddons]);
    const extra = useMemo(() => (allowsAddons ? addonExtra(selected, catalog) : 0), [selected, catalog, allowsAddons]);
    const summary = useMemo(() => (allowsAddons ? addonSummary(selected, catalog) : []), [selected, catalog, allowsAddons]);
    const includedLabels = useMemo(() => Object.values(DEFAULT_ADDONS).map((id, i) => {
        const group = Object.keys(DEFAULT_ADDONS)[i];
        return catalog[group]?.options?.find((o) => o.id === id)?.label || id;
    }), [catalog]);
    const basePrice = Number(product?.sale_price || product?.price || 0);
    const totalPrice = basePrice + extra;

    if (loading) return <div className="page shell"><Loading label="Loading product" /></div>;
    if (error || !product) return <div className="page shell"><ErrorState message={error || 'Product not found.'} /></div>;

    const images = [product.image_url || product.thumbnail || product.image, ...(product.gallery_urls || product.gallery || product.images || []).map((x) => x.path || x)].filter(Boolean);
    const specs = Array.isArray(product.specifications) ? product.specifications : Object.entries(product.specifications || product.specs || {}).map(([name, value]) => ({ name, value }));

    return <div className="page shell">
        <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><b>{product.name}</b></div>
        <section className="product-detail">
            <div className="gallery"><div className="main-image"><Media src={images[active]} alt={product.name} /></div>{images.length > 1 && <div className="thumbs">{images.map((image, i) => <button className={active === i ? 'active' : ''} onClick={() => setActive(i)} key={image}><Media src={image} alt={`${product.name} view ${i + 1}`} /></button>)}</div>}</div>
            <div className="product-summary">
                <span className="product-brand">{product.brand?.name || 'Nexify selection'}</span>
                <h1>{product.name}</h1>
                {product.sku && <small>SKU: {product.sku}</small>}
                <div className="detail-price">
                    <strong>{money(totalPrice)}</strong>
                    {product.sale_price && <del>{money(Number(product.price) + extra)}</del>}
                    {allowsAddons && extra > 0 && <span className="addon-extra">Base {money(basePrice)} + add-ons {money(extra)}</span>}
                </div>
                <p className={`availability ${product.stock === 0 ? 'out' : ''}`}><Check /> {product.stock === 0 ? 'Currently out of stock' : product.stock ? `${product.stock} in stock` : 'Ready to order'}</p>
                <p className="short-description">{product.short_description || product.description?.replace(/<[^>]*>/g, '').slice(0, 260)}</p>

                {allowsAddons && <div className="addon-panel">
                    <div className="addon-panel-head">
                        <h2>Customize your setup</h2>
                        <p>Included by default: {includedLabels.join(', ')}.</p>
                    </div>
                    {Object.entries(catalog).map(([group, config]) => (
                        <div className="addon-group" key={group}>
                            <h3>{config.label}</h3>
                            <div className="addon-options">
                                {config.options.map((option) => {
                                    const activeOpt = selected[group] === option.id;
                                    return (
                                        <button
                                            type="button"
                                            key={option.id}
                                            className={`addon-option ${activeOpt ? 'active' : ''}`}
                                            onClick={() => setAddons((current) => ({ ...current, [group]: option.id }))}
                                        >
                                            <span className="addon-option-label">{option.label}</span>
                                            <span className="addon-option-price">{option.price > 0 ? `+${money(option.price)}` : 'Included'}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <ul className="addon-summary-list">
                        {summary.map((item) => <li key={item.group}>{item.label}{item.price > 0 ? ` (+${money(item.price)})` : ''}</li>)}
                    </ul>
                </div>}

                <div className="buy-row">
                    <div className="qty large"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)}><Plus /></button></div>
                    <button className="btn add-detail" disabled={product.stock === 0} onClick={() => cart.add(product, quantity, allowsAddons ? selected : null)}><ShoppingCart /> Add to cart</button>
                    <button className="icon-btn wish" aria-label="Add to wishlist"><Heart /></button>
                </div>
                <div className="buy-benefits"><div><Truck /><span><b>Delivery across Pakistan</b><small>Tracked and carefully packed</small></span></div><div><ShieldCheck /><span><b>Buy with confidence</b><small>Genuine product assurance</small></span></div></div>
            </div>
        </section>
        <section className="product-content"><div><h2>Product overview</h2><div className="rich-content" dangerouslySetInnerHTML={{ __html: product.description || '<p>More product details will be added soon.</p>' }} /></div>{!!specs.length && <div><h2>Specifications</h2><dl className="spec-list">{specs.map((item, i) => <div key={item.name || i}><dt>{item.name || item.key}</dt><dd>{String(item.value)}</dd></div>)}</dl></div>}</section>
        {!!product.related_products?.length && <section className="section related"><SectionTitle eyebrow="You may also like" title="Complete your setup" /><div className="product-grid">{product.related_products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}</div></section>}
    </div>;
}
