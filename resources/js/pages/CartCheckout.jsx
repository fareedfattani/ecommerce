import { ArrowLeft, CheckCircle2, Minus, Plus, TicketPercent, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { api, messageFrom, unwrap } from '../api/client';
import { Media, money } from '../components/Common';
import { useCart, useStore } from '../contexts/StoreContext';
import { PAKISTAN_CITIES, resolveShippingRates, shippingForCity } from '../data/shipping';

function cartPayload(items) {
    return items.map((x) => {
        const payload = { product_id: x.id, quantity: x.quantity };
        if (x.addons) payload.addons = x.addons;
        return payload;
    });
}

function AddonMeta({ item }) {
    const labels = (item.addon_summary || []).map((x) => x.label);
    if (!labels.length) return null;
    return <small className="cart-addons">{labels.join(' · ')}</small>;
}

export function CartPage() {
    const cart = useCart();
    return <div className="page shell narrow"><div className="page-title left"><span className="eyebrow">Your selection</span><h1>Shopping cart</h1></div>
        {!cart.items.length ? <div className="state-box"><h2>Your cart is empty</h2><p>Discover reliable tech picked for real life.</p><Link className="btn" to="/shop">Start shopping</Link></div> : <div className="cart-page-grid"><section className="cart-table">{cart.items.map((item) => {
            const key = item.lineKey || item.id;
            const price = Number(item.unit_price ?? item.sale_price ?? item.price ?? 0);
            return <div className="cart-page-line" key={key}>
                <Media src={item.image_url || item.thumbnail || item.image} alt={item.name} />
                <div>
                    <Link to={`/product/${item.slug}`}><h3>{item.name}</h3></Link>
                    <AddonMeta item={item} />
                    <span>{money(price)}</span>
                </div>
                <div className="qty">
                    <button onClick={() => cart.update(key, item.quantity - 1)}><Minus /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => cart.update(key, item.quantity + 1)}><Plus /></button>
                </div>
                <strong>{money(price * item.quantity)}</strong>
                <button className="remove" onClick={() => cart.remove(key)}><Trash2 /></button>
            </div>;
        })}</section><OrderTotal cart={cart} /></div>}
    </div>;
}

function OrderTotal({ cart, checkout = false, coupon = null, shipping = 0, city = '' }) {
    const discount = Number(coupon?.discount || 0);
    const shippingAmount = Number(shipping || 0);
    const total = Math.max(0, cart.total - discount) + shippingAmount;
    return <aside className="order-total"><h2>Order summary</h2><div><span>Items ({cart.count})</span><strong>{money(cart.total)}</strong></div><div><span>Delivery{city ? ` (${city})` : ''}</span>{checkout ? <strong>{city ? money(shippingAmount) : 'Select city'}</strong> : <span>Calculated at checkout</span>}</div>{discount > 0 && <div className="coupon-saving"><span>Coupon ({coupon.coupon?.code})</span><strong>-{money(discount)}</strong></div>}<hr /><div className="grand"><span>Total</span><strong>{money(total)}</strong></div>{!checkout && <Link className="btn btn-block" to="/checkout">Continue to checkout</Link>}<small>Cash on Delivery available nationwide.</small></aside>;
}

export function Checkout() {
    const cart = useCart();
    const store = useStore();
    const rates = useMemo(() => resolveShippingRates(store.settings || {}), [store.settings]);
    const [form, setForm] = useState({ customer_name: '', email: '', phone: '', city: '', address: '', notes: '' });
    const [loading, setLoading] = useState(false), [error, setError] = useState('');
    const [couponCode, setCouponCode] = useState(''), [coupon, setCoupon] = useState(null), [couponError, setCouponError] = useState(''), [applyingCoupon, setApplyingCoupon] = useState(false);
    const shipping = useMemo(() => shippingForCity(form.city, rates), [form.city, rates]);
    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplyingCoupon(true); setCouponError('');
        try {
            const result = unwrap(await api.post('/coupons/validate', { coupon_code: couponCode, items: cartPayload(cart.items) }));
            setCoupon(result);
        } catch (err) { setCoupon(null); setCouponError(messageFrom(err)); } finally { setApplyingCoupon(false); }
    };
    const submit = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            const result = unwrap(await api.post('/orders', { ...form, coupon_code: coupon?.coupon?.code, items: cartPayload(cart.items) }));
            const order = result.order || result;
            cart.clear();
            window.history.replaceState({}, '', '/order-success');
            window.location.assign(`/order-success?order=${encodeURIComponent(order?.order_number || order?.id || '')}`);
        } catch (err) { setError(messageFrom(err)); setLoading(false); }
    };
    if (!cart.items.length) return <Navigate to="/cart" replace />;
    const field = (key, value) => setForm((x) => ({ ...x, [key]: value }));
    const finalTotal = Math.max(0, cart.total - Number(coupon?.discount || 0)) + shipping;
    return <div className="page shell"><div className="page-title left"><Link className="back-link" to="/cart"><ArrowLeft /> Back to cart</Link><h1>Delivery details</h1><p>Complete your order — pay cash when it arrives.</p></div><form className="checkout-grid" onSubmit={submit}><section className="checkout-form"><h2>Contact information</h2><div className="form-grid"><label>Full name<input required value={form.customer_name} onChange={(e) => field('customer_name', e.target.value)} /></label><label>Mobile number<input required inputMode="tel" placeholder="03XX XXXXXXX" value={form.phone} onChange={(e) => field('phone', e.target.value)} /></label><label className="full">Email address <small>(optional)</small><input type="email" value={form.email} onChange={(e) => field('email', e.target.value)} /></label></div><h2>Shipping address</h2><div className="form-grid"><label className="full">Complete address<textarea required rows="3" value={form.address} onChange={(e) => field('address', e.target.value)} /></label><label>City<select required value={form.city} onChange={(e) => field('city', e.target.value)}><option value="">Select city</option>{PAKISTAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select><small className="city-shipping-hint">{form.city ? `Delivery: ${money(shipping)}` : `Karachi ${money(rates.karachi)} · Other cities ${money(rates.other)}`}</small></label><label className="full">Order notes<textarea rows="2" value={form.notes} onChange={(e) => field('notes', e.target.value)} placeholder="Landmark or special instructions" /></label></div><div className="coupon-box"><div><TicketPercent /><span><b>Discount coupon</b><small>Enter your voucher code</small></span></div>{coupon ? <div className="coupon-applied"><span><b>{coupon.coupon.code}</b> applied — you save {money(coupon.discount)}</span><button type="button" onClick={() => { setCoupon(null); setCouponCode(''); }} aria-label="Remove coupon"><X /></button></div> : <div className="coupon-input"><input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME5" /><button type="button" className="btn btn-outline" onClick={applyCoupon} disabled={applyingCoupon}>{applyingCoupon ? 'Checking…' : 'Apply'}</button></div>}{couponError && <p className="form-error">{couponError}</p>}</div><div className="payment-box"><b>Cash on Delivery</b><p>Pay in cash when your order arrives. Our team may call to confirm your order.</p></div>{error && <p className="form-error">{error}</p>}<button className="btn btn-block" disabled={loading || !form.city}>{loading ? 'Placing order…' : `Place order — ${money(finalTotal)}`}</button></section><OrderTotal cart={cart} checkout coupon={coupon} shipping={shipping} city={form.city} /></form></div>;
}

export function OrderSuccess() {
    const order = new URLSearchParams(useLocation().search).get('order');
    return <div className="page shell"><div className="success-card"><CheckCircle2 /><span className="eyebrow">Order confirmed</span><h1>Thank you for choosing Nexify!</h1><p>Your order has been received. We’ll contact you shortly to confirm delivery details.</p>{order && <div className="order-number"><span>Order reference</span><strong>{order}</strong></div>}<div><Link className="btn" to="/shop">Continue shopping</Link><Link className="btn btn-ghost" to="/">Back home</Link></div></div></div>;
}
