import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/StoreContext';
import { Media, money } from './Common';

function AddonMeta({ item }) {
    const labels = (item.addon_summary || []).map((x) => x.label);
    if (!labels.length) return null;
    return <small className="cart-addons">{labels.join(' · ')}</small>;
}

export default function CartDrawer() {
    const cart = useCart();
    if (!cart.drawerOpen) return null;
    return <div className="drawer-backdrop" onMouseDown={() => cart.setDrawerOpen(false)}>
        <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()} aria-label="Shopping cart">
            <div className="drawer-head"><h2><ShoppingBag /> Your cart <span>{cart.count}</span></h2><button className="icon-btn" onClick={() => cart.setDrawerOpen(false)}><X /></button></div>
            <div className="drawer-items">
                {!cart.items.length && <div className="empty-mini"><ShoppingBag /><p>Your cart is ready for something great.</p><Link to="/shop" onClick={() => cart.setDrawerOpen(false)}>Explore products</Link></div>}
                {cart.items.map((item) => {
                    const key = item.lineKey || item.id;
                    const price = Number(item.unit_price ?? item.sale_price ?? item.price ?? 0);
                    return <div className="cart-line" key={key}>
                        <Media src={item.image_url || item.thumbnail || item.image} alt={item.name} />
                        <div>
                            <Link to={`/product/${item.slug}`} onClick={() => cart.setDrawerOpen(false)}>{item.name}</Link>
                            <AddonMeta item={item} />
                            <strong>{money(price)}</strong>
                            <div className="qty">
                                <button onClick={() => cart.update(key, item.quantity - 1)}><Minus /></button>
                                <span>{item.quantity}</span>
                                <button onClick={() => cart.update(key, item.quantity + 1)}><Plus /></button>
                            </div>
                        </div>
                        <button className="remove" onClick={() => cart.remove(key)} aria-label={`Remove ${item.name}`}><Trash2 /></button>
                    </div>;
                })}
            </div>
            {!!cart.items.length && <div className="drawer-foot"><div><span>Subtotal</span><strong>{money(cart.total)}</strong></div><small>Delivery charges are confirmed at checkout.</small><Link className="btn btn-block" to="/checkout" onClick={() => cart.setDrawerOpen(false)}>Proceed to checkout</Link><Link className="text-link" to="/cart" onClick={() => cart.setDrawerOpen(false)}>View full cart</Link></div>}
        </aside>
    </div>;
}
