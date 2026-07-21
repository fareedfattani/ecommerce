import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Headphones, PackageCheck, ShieldCheck, Truck, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Media, SectionTitle, stripHtml } from '../components/Common';
import ProductCard from '../components/ProductCard';
import { useStore } from '../contexts/StoreContext';

export default function Home() {
    const store = useStore();
    const heroVisual = useRef(null);
    const banner = store.banners?.[0] || {};
    const hero = {
        title: banner.title || 'Upgrade your everyday tech.',
        subtitle: banner.subtitle || 'Curated laptops, components and accessories with honest guidance, competitive prices and delivery across Pakistan.',
        image: banner.image,
        button_text: banner.button_text || 'Explore the collection',
        button_url: banner.url || banner.button_url || '/shop',
    };
    useEffect(() => {
        let frame;
        const updateDepth = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const element = heroVisual.current;
                if (!element) return;
                const rect = element.getBoundingClientRect();
                const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
                const shift = (progress - 0.5) * -34;
                element.style.setProperty('--hero-shift', `${shift}px`);
                element.style.setProperty('--hero-orb-shift', `${shift * -0.35}px`);
                element.style.setProperty('--hero-card-shift', `${shift * -0.5}px`);
                element.style.setProperty('--hero-rotate-x', `${(0.5 - progress) * 7}deg`);
                element.style.setProperty('--hero-rotate-y', `${(progress - 0.5) * 13}deg`);
            });
        };
        updateDepth();
        window.addEventListener('scroll', updateDepth, { passive: true });
        window.addEventListener('resize', updateDepth);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', updateDepth);
            window.removeEventListener('resize', updateDepth);
        };
    }, []);
    return <>
        <section className="hero"><div className="shell hero-grid">
            <div className="hero-copy"><span className="eyebrow"><Zap size={15} /> Smart tech. Better choices.</span><h1>{hero.title}</h1><p>{hero.subtitle}</p><div className="hero-actions"><Link className="btn" to={hero.button_url}>{hero.button_text} <ArrowRight /></Link><Link className="btn btn-ghost" to="/contact">Talk to an expert</Link></div><div className="hero-note"><span><b>4.9/5</b> buyer satisfaction</span><span><b>100%</b> genuine products</span></div></div>
            <div className="hero-visual hero-3d" ref={heroVisual}><div className="orb" /><Media src={hero.image} alt={hero.title} /><div className="float-card"><ShieldCheck /><span><b>Buy with confidence</b>Quality checked & supported</span></div></div>
        </div></section>
        <section className="benefits shell">{[[Truck, 'Nationwide delivery', 'Carefully packed'], [PackageCheck, 'Genuine products', 'Quality assured'], [Headphones, 'Human support', 'Before & after sales'], [ShieldCheck, 'Cash on delivery', 'Simple, secure ordering']].map(([Icon, title, text]) => <div key={title}><Icon /><span><b>{title}</b><small>{text}</small></span></div>)}</section>

        {!!store.categories.length && <section className="section shell"><SectionTitle eyebrow="Find your fit" title="Shop by category" text="A faster way to the tech you need." action={<Link className="text-link" to="/shop">Browse all <ArrowRight /></Link>} /><div className="category-grid">{store.categories.slice(0, 8).map((item) => <Link className="category-card" key={item.id || item.slug} to={`/shop?category=${item.slug || item.id}`}><Media src={item.image} alt={item.name} /><div><h3>{item.name}</h3><span>{item.products_count || 'Explore'} products <ArrowRight /></span></div></Link>)}</div></section>}
        <ProductSection eyebrow="Handpicked" title="Featured technology" products={store.featured_products} carousel />

        <section className="promo shell"><div><span className="eyebrow">The Nexify promise</span><h2>Not sure what fits your workflow?</h2><p>Tell us your budget and needs. Our team will help you shortlist the right setup without the jargon.</p><Link className="btn btn-light" to="/contact">Get expert guidance <ArrowRight /></Link></div><div className="promo-art"><span>NX</span><small>Power your next</small></div></section>

        <ProductSection eyebrow="Limited time" title="Deals worth discovering" products={store.sale_products} />
        {!!store.brands.length && <section className="section shell"><SectionTitle eyebrow="Trusted names" title="Shop leading brands" /><div className="brand-row">{store.brands.slice(0, 10).map((brand) => <Link key={brand.id || brand.slug} to={`/shop?brand=${brand.slug || brand.id}`}><Media src={brand.logo || brand.image} alt={brand.name} /><b>{brand.name}</b></Link>)}</div></section>}

        {!!store.testimonials.length && <section className="section soft"><div className="shell"><SectionTitle eyebrow="Real experiences" title="Customers choose Nexify" /><div className="testimonial-grid">{store.testimonials.slice(0, 3).map((item) => <blockquote key={item.id || item.name}><div className="stars">★★★★★</div><p>“{item.content || item.text}”</p><footer><b>{item.name}</b><span>{item.designation || 'Verified buyer'}</span></footer></blockquote>)}</div></div></section>}
        {!!store.posts.length && <section className="section shell"><SectionTitle eyebrow="Nexify journal" title="Fresh from the blog" action={<Link className="text-link" to="/blog">View all <ArrowRight /></Link>} /><div className="blog-grid">{store.posts.slice(0, 3).map((post) => <Link className="blog-card" key={post.id || post.slug} to={`/blog/${post.slug}`}><Media src={post.featured_image || post.image} alt={post.title} /><div><span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Buying guide'}</span><h3>{post.title}</h3><p>{stripHtml(post.excerpt || post.content || '').slice(0, 110)}</p><b>Read article <ArrowRight /></b></div></Link>)}</div></section>}
        {!!store.faqs.length && <Faqs items={store.faqs} />}
        <Newsletter />
    </>;
}

function ProductSection({ eyebrow, title, products = [], carousel = false }) {
    if (!products.length) return null;
    return <section className="section shell"><SectionTitle eyebrow={eyebrow} title={title} action={<Link className="text-link" to="/shop">Shop all <ArrowRight /></Link>} />{carousel ? <AutoProductCarousel products={products.slice(0, 12)} /> : <div className="product-grid">{products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}</div>}</section>;
}

function AutoProductCarousel({ products }) {
    const track = useRef(null);
    const [paused, setPaused] = useState(false);
    const move = (direction = 1) => {
        const element = track.current;
        if (!element) return;
        const card = element.querySelector('.product-card');
        const distance = (card?.getBoundingClientRect().width || element.clientWidth) + 16;
        const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - distance / 2;
        const atStart = element.scrollLeft <= distance / 2;
        if (direction > 0 && atEnd) element.scrollTo({ left: 0, behavior: 'smooth' });
        else if (direction < 0 && atStart) element.scrollTo({ left: element.scrollWidth, behavior: 'smooth' });
        else element.scrollBy({ left: direction * distance, behavior: 'smooth' });
    };
    useEffect(() => {
        if (paused || products.length < 2) return;
        const timer = window.setInterval(() => move(1), 3200);
        return () => window.clearInterval(timer);
    }, [paused, products.length]);
    return <div className="featured-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="featured-track" ref={track}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        <button className="carousel-arrow prev" onClick={() => move(-1)} aria-label="Previous product"><ChevronLeft /></button>
        <button className="carousel-arrow next" onClick={() => move(1)} aria-label="Next product"><ChevronRight /></button>
    </div>;
}

function Faqs({ items }) {
    const [open, setOpen] = useState(0);
    return <section className="section soft"><div className="shell faq-wrap"><SectionTitle eyebrow="Questions, answered" title="Shopping made clear" /><div className="faq-list">{items.slice(0, 8).map((item, index) => <div className={`faq ${open === index ? 'open' : ''}`} key={item.id || index}><button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span>{item.question}</span><ChevronDown /></button>{open === index && <p>{item.answer}</p>}</div>)}</div></div></section>;
}

function Newsletter() {
    const [email, setEmail] = useState(''), [status, setStatus] = useState('');
    const submit = async (e) => { e.preventDefault(); setStatus('Sending…'); try { await api.post('/subscribers', { email }); setStatus('You’re on the list!'); setEmail(''); } catch { setStatus('Please use a valid email.'); } };
    return <section className="newsletter"><div className="shell"><div><span className="eyebrow">Stay in the loop</span><h2>Better deals, useful guides, no clutter.</h2></div><form onSubmit={submit}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" /><button className="btn">Subscribe</button><small>{status}</small></form></div></section>;
}
