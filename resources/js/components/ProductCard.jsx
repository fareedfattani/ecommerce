import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/StoreContext';
import { Media, money } from './Common';

export default function ProductCard({ product }) {
    const { add } = useCart();
    const image = product.image_url || product.thumbnail || product.image || product.images?.[0]?.path || product.images?.[0];
    const price = Number(product.sale_price || product.price || 0);
    const oldPrice = product.sale_price ? Number(product.price || 0) : 0;
    const discount = oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
    return <article className="product-card">
        <Link to={`/product/${product.slug}`} className="product-image">
            <Media src={image} alt={product.name} />
            {discount > 0 && <span className="sale-badge">-{discount}%</span>}
            {product.stock === 0 && <span className="stock-badge">Sold out</span>}
        </Link>
        <div className="product-info">
            <span className="product-brand">{product.brand?.name || product.brand_name || 'Nexify Choice'}</span>
            <Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
            <div className="price-row"><strong>{money(price)}</strong>{oldPrice > price && <del>{money(oldPrice)}</del>}</div>
            <button className="add-btn" disabled={product.stock === 0} onClick={() => add(product)}><ShoppingCart size={17} /> Add to cart</button>
        </div>
    </article>;
}
