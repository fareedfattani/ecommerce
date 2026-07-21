import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, listFrom, messageFrom, unwrap } from '../api/client';
import { Empty, ErrorState, Loading, Media, Pagination, stripHtml } from '../components/Common';

export { Contact } from './QuoteContact';

export function About() {
    return <><section className="inner-hero"><div className="shell"><span className="eyebrow">Our story</span><h1>Technology should move you forward.</h1><p>Nexify helps people and businesses across Pakistan choose dependable tech without the confusion.</p></div></section><section className="page shell content-split"><div><span className="eyebrow">Why Nexify</span><h2>Practical advice. Genuine products. Support that stays.</h2></div><div><p>We built Nexify around a simple idea: buying technology should feel informed and reassuring. Our collection focuses on useful, reliable products for students, creators, professionals and growing businesses.</p><p>From choosing the right laptop to completing a workstation, we combine clear guidance, thoughtful selection and nationwide delivery.</p><Link className="btn" to="/shop">Explore our collection <ArrowRight /></Link></div></section></>;
}

export function Blog() {
    const [result, setResult] = useState({ items: [], meta: {} }), [loading, setLoading] = useState(true), [page, setPage] = useState(1);
    useEffect(() => { setLoading(true); api.get(`/posts?page=${page}`).then((r) => setResult(listFrom(r))).finally(() => setLoading(false)); }, [page]);
    return <div className="page shell"><div className="page-title"><span className="eyebrow">Nexify journal</span><h1>Ideas for better tech decisions</h1><p>Buying guides, practical comparisons and useful tips.</p></div>{loading ? <Loading /> : !result.items.length ? <Empty title="No articles yet" /> : <><div className="blog-grid listing">{result.items.map((post) => <Link className="blog-card" key={post.id} to={`/blog/${post.slug}`}><Media src={post.featured_image || post.image} alt={post.title} /><div><span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Guide'}</span><h2>{post.title}</h2><p>{stripHtml(post.excerpt || post.content || '').slice(0, 150)}</p><b>Read article <ArrowRight /></b></div></Link>)}</div><Pagination meta={result.meta} onPage={setPage} /></>}</div>;
}

export function BlogDetail() {
    const { slug } = useParams(), [post, setPost] = useState(null), [error, setError] = useState('');
    useEffect(() => {
        api.get(`/posts/${slug}`)
            .then((r) => {
                const data = unwrap(r);
                setPost(data.post || data);
            })
            .catch((e) => setError(messageFrom(e)));
    }, [slug]);
    if (error) return <div className="page shell"><ErrorState message={error} /></div>;
    if (!post) return <div className="page shell"><Loading /></div>;
    return <article className="page shell article"><div className="article-head"><span className="eyebrow">Nexify journal</span><h1>{post.title}</h1><p>{post.published_at && new Date(post.published_at).toLocaleDateString('en-PK', { dateStyle: 'long' })}</p></div><Media src={post.featured_image || post.image} alt={post.title} /><div className="rich-content" dangerouslySetInnerHTML={{ __html: post.content || '' }} /></article>;
}

export function CmsPage() {
    const { slug } = useParams(), [page, setPage] = useState(null), [error, setError] = useState('');
    useEffect(() => {
        api.get(`/pages/${slug}`)
            .then((r) => {
                const data = unwrap(r);
                setPage(data.page || data);
            })
            .catch((e) => setError(messageFrom(e)));
    }, [slug]);
    if (error) return <div className="page shell"><ErrorState message={error} /></div>;
    if (!page) return <div className="page shell"><Loading /></div>;
    return <article className="page shell article">
        <div className="article-head"><span className="eyebrow">Nexify</span><h1>{page.title}</h1></div>
        {page.content
            ? <div className="rich-content" dangerouslySetInnerHTML={{ __html: page.content }} />
            : <p className="rich-content">Content coming soon.</p>}
    </article>;
}

export function NotFound() {
    return <div className="page shell"><div className="success-card"><strong className="error-code">404</strong><h1>That page took a detour.</h1><p>Let’s get you back to useful technology.</p><Link className="btn" to="/">Return home</Link></div></div>;
}
