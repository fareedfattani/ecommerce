import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, messageFrom, unwrap } from '../api/client';
import { ErrorState, Loading, money } from '../components/Common';

export default function Dashboard() {
    const [data, setData] = useState(null), [error, setError] = useState('');
    useEffect(() => { api.get('/cp/dashboard').then((r) => setData(unwrap(r))).catch((e) => setError(messageFrom(e))); }, []);
    if (error) return <AdminPage><ErrorState message={error} /></AdminPage>;
    if (!data) return <AdminPage><Loading label="Loading dashboard" /></AdminPage>;
    const stats = data.stats || {
        revenue: data.orders?.revenue ?? 0,
        orders: data.counts?.orders ?? 0,
        products: data.counts?.products ?? 0,
        customers: data.counts?.customers ?? 0,
    };
    return <AdminPage title="Dashboard" subtitle="A quick look at how Nexify is doing.">
        <div className="stats-grid">{[[DollarSign, 'Revenue', money(stats.revenue || stats.total_revenue)], [ShoppingCart, 'Orders', stats.orders || stats.total_orders || 0], [Package, 'Products', stats.products || stats.total_products || 0], [Users, 'Customers', stats.customers || stats.total_customers || 0]].map(([Icon, label, value]) => <div className="stat-card" key={label}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong></div></div>)}</div>
        <section className="admin-card"><div className="card-head"><div><h2>Recent orders</h2><p>Latest storefront activity</p></div></div><div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th></tr></thead><tbody>{(data.recent_orders || data.orders_data || []).map((order) => <tr key={order.id}><td><b>#{order.order_number || order.id}</b></td><td>{order.customer_name || order.name}</td><td><span className={`status ${order.status}`}>{order.status}</span></td><td>{money(order.total)}</td><td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div></section>
    </AdminPage>;
}

export function AdminPage({ title, subtitle, action, children }) {
    return <main className="admin-page">{title && <div className="admin-page-head"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>}{children}</main>;
}
