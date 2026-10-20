import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, ChevronDown, CircleHelp, HeartHandshake, Leaf, MapPin, Search, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { getCategories, getFarmer, getProduct, getProducts } from '../services/productService';
import { getMarketPrices } from '../services/marketPriceService';
import { mediaUrl, messageFromError } from '../services/api';
import { fallbackProductImage, productImage } from '../utils/productImage';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/PageStates';
import en from '../locales/en';

const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=88';
export function HomePage() {
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [prices, setPrices] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [pricesError, setPricesError] = useState('');
  useEffect(() => {
    getProducts({ limit: 4, sort: 'newest' })
      .then((productResponse) => {
        setProducts(productResponse.data.products);
        setFarmers([...new Map(productResponse.data.products.filter((product) => product.farmer?.isVerified).map((product) => [product.farmer._id, product.farmer])).values()].slice(0, 3));
      })
      .catch((error) => setProductsError(messageFromError(error)))
      .finally(() => setProductsLoading(false));
    getMarketPrices()
      .then(({ data }) => setPrices(data.marketPrices.slice(0, 3)))
      .catch((error) => setPricesError(messageFromError(error)))
      .finally(() => setPricesLoading(false));
  }, []);
  return <div className="home-page">
    <section className="hero-section"><div className="hero-image" style={{ backgroundImage: `url(${fallbackImage})` }} /><div className="hero-shade" /><div className="hero-content"><div className="eyebrow light"><span /> ROOTED IN COMMUNITY, GROWN WITH CARE</div><h1>Farm fresh.<br /><em>Direct from</em><br />the source.</h1><p>Good food has a story. Find yours, straight from the people who grow it.</p><div className="hero-actions"><Link to="/marketplace" className="button button-cream">{en.actions.shop}<ArrowRight size={17} /></Link><Link to="/register?role=farmer" className="hero-sell-link">{en.actions.sell}<ArrowUpRight size={15} /></Link></div><div className="hero-social"><div className="avatar-stack"><span>K</span><span>M</span><span>A</span><span>+</span></div><span><b>1,200+</b> growers & good-food lovers</span></div></div><div className="hero-note"><Leaf size={15} /> PICKED WITH PURPOSE <span>•</span> PRICED WITH CARE</div></section>
    <section className="trust-strip"><span><BadgeCheck /> Farmers you can trust</span><span><HeartHandshake /> Fair prices for everyone</span><span><Truck /> From farm to your door</span><span><Sprout /> Naturally fresh produce</span></section>
    <section className="section-wrap how-section" id="how-it-works"><div className="section-heading"><div><div className="eyebrow">GOOD THINGS GROW TOGETHER</div><h2>Simple, from soil <em>to table.</em></h2></div><p>No long supply chains. Just real people, good food, and a better way to buy and sell.</p></div><div className="steps-grid">{[['01','Farmer lists','Local growers share what’s fresh from the farm.'],['02','You discover','Find seasonal produce and the people behind it.'],['03','Order directly','Transparent prices. A simple, secure checkout.'],['04','Fresh to you','Track your order from pickup to delivery.']].map(([number,title,text]) => <article className="step-card" key={number}><span className="step-number">{number}</span><div className="step-icon">{number === '01' ? '🌱' : number === '02' ? '🧺' : number === '03' ? '🤝' : '🚲'}</div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="section-wrap featured-section"><div className="section-heading"><div><div className="eyebrow">A LITTLE SOMETHING FRESH</div><h2>Picked for <em>your table.</em></h2></div><Link to="/marketplace" className="arrow-link">Explore all produce <ArrowRight size={16} /></Link></div>{productsLoading ? <LoadingState /> : productsError ? <ErrorState message={productsError} /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <EmptyState>No listings are available yet.</EmptyState>}</section>
    <section className="farmer-feature"><div className="farmer-image" /><div className="farmer-feature-copy"><div className="eyebrow light">PEOPLE MAKE THE DIFFERENCE</div><h2>Behind every harvest<br />is a <em>hardworking hand.</em></h2><p>We believe the people who grow our food deserve to be seen, supported, and paid fairly. Meet local farmers and discover the care in every harvest.</p>{farmers.length > 0 && <div className="featured-growers">{farmers.map((farmer) => <Link key={farmer._id} to={`/farmer/${farmer._id}`}><span>{farmer.name?.[0]}</span><b>{farmer.name}</b><small>{farmer.district} · ✓ Verified</small></Link>)}</div>}<Link to="/marketplace" className="button button-cream">Meet our growers <ArrowRight size={16} /></Link></div><div className="farmer-stat"><b>100%</b><span>direct connections</span></div></section>
    <section className="section-wrap market-preview"><div className="section-heading"><div><div className="eyebrow">KNOW WHAT YOUR HARVEST IS WORTH</div><h2>Markets, made <em>more open.</em></h2></div><Link to="/market-prices" className="arrow-link">View all prices <ArrowRight size={16} /></Link></div><p className="demo-note"><CircleHelp size={15} /> Indicative demo prices — not real-time market data.</p>{pricesLoading ? <LoadingState /> : pricesError ? <ErrorState message={pricesError} /> : prices.length ? <div className="price-preview-grid">{prices.map((price) => <div className="price-preview-card" key={price._id}><span>{price.crop}</span><b>₹{price.averagePrice}<small> / {price.unit}</small></b><small>{price.market} · {price.location}</small></div>)}</div> : <EmptyState>No market-price references yet.</EmptyState>}</section>
    <section className="cta-section"><div className="eyebrow light">THE GOOD GROWS WHEN WE DO</div><h2>Good food is better<br />when it's <em>closer.</em></h2><p>Whether you grow or gather, there's a place for you here.</p><div><Link to="/register?role=buyer" className="button button-cream">Start shopping <ArrowRight size={16} /></Link><Link to="/register?role=farmer" className="button button-outline light-outline">Join as a farmer</Link></div></section>
  </div>;
}

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const filters = Object.fromEntries(searchParams.entries());
  useEffect(() => { getCategories().then(({ data }) => setCategories(data.categories)).catch(() => setCategories([])); }, []);
  useEffect(() => {
    setLoading(true); setError('');
    getProducts({ ...filters, page: filters.page || 1, limit: 12 })
      .then(({ data }) => { setProducts(data.products); setPagination(data.pagination); })
      .catch((err) => setError(messageFromError(err)))
      .finally(() => setLoading(false));
  }, [searchParams.toString(), reload]);
  function changeFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page'); setSearchParams(next);
  }
  return <div className="page-container marketplace-page">
    <div className="marketplace-heading"><div><div className="eyebrow">GROWN CLOSE. SHARED FAIR.</div><h1>Good things, <em>in season.</em></h1><p>Find food with a farm, a farmer, and a story behind it.</p></div><div className="market-count"><b>{pagination.total || 0}</b><span>fresh listings<br />from local farms</span></div></div>
    <div className="market-tools"><label className="search-field"><Search size={18} /><input value={filters.search || ''} onChange={(event) => changeFilter('search', event.target.value)} placeholder="What are you looking for?" /></label><label className="filter-select"><MapPin size={16} /><input value={filters.district || ''} onChange={(event) => changeFilter('district', event.target.value)} placeholder="Any location" /></label><label className="filter-select"><select value={filters.category || ''} onChange={(event) => changeFilter('category', event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select><ChevronDown size={15} /></label><label className="filter-select"><select value={filters.sort || 'newest'} onChange={(event) => changeFilter('sort', event.target.value)}><option value="newest">Recently added</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated farmers</option></select><ChevronDown size={15} /></label></div>
    <div className="market-extra-filters"><label>Min ₹<input type="number" min="0" value={filters.minPrice || ''} onChange={(event) => changeFilter('minPrice', event.target.value)} placeholder="0" /></label><label>Max ₹<input type="number" min="0" value={filters.maxPrice || ''} onChange={(event) => changeFilter('maxPrice', event.target.value)} placeholder="Any" /></label><label>Season<input value={filters.season || ''} onChange={(event) => changeFilter('season', event.target.value)} placeholder="Any season" /></label><label>Availability<select value={filters.availability || 'available'} onChange={(event) => changeFilter('availability', event.target.value === 'available' ? '' : event.target.value)}><option value="available">Available now</option><option value="all">Include unavailable</option></select></label><button className="clear-filters" onClick={() => setSearchParams({})}>Clear filters</button></div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => setReload((current) => current + 1)} /> : products.length ? <><div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>{pagination.pages > 1 && <div className="pagination"><button disabled={pagination.page <= 1} onClick={() => changeFilter('page', pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button disabled={pagination.page >= pagination.pages} onClick={() => changeFilter('page', pagination.page + 1)}>Next</button></div>}</> : <EmptyState>No products found. Try changing your filters.</EmptyState>}
  </div>;
}

export function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { getProduct(id).then(({ data }) => { setProduct(data.product); setQty(Number(data.product.minimumOrderQuantity) || 1); }).catch(() => setError(true)); }, [id]);
  if (error) return <div className="page-container"><ErrorState message="We couldn't find this produce listing." /></div>;
  if (!product) return <LoadingState />;
  const farmer = product.farmer || {};
  function buyNow() {
    try {
      add(product, Number(qty));
      if (!user) navigate('/login', { state: { from: { pathname: '/buyer/checkout' } } });
      else navigate('/buyer/checkout');
    } catch (err) { window.alert(err.message); }
  }
  return <div className="page-container detail-page"><div className="breadcrumbs"><Link to="/marketplace">Marketplace</Link> / {product.category?.name} / {product.name}</div><div className="detail-grid"><div className="detail-photo"><img src={mediaUrl(productImage(product) || fallbackImage)} alt={product.name} onError={(event) => fallbackProductImage(event, product)} />{product.isOrganic && <span className="organic-tag">Organically grown</span>}</div><section className="detail-info"><div className="eyebrow">{product.category?.name || 'FRESH FROM THE FARM'}</div><h1>{product.name}</h1><p className="detail-location"><MapPin size={16} /> {product.location || product.district}, {product.state}</p><div className="detail-price">₹{Number(product.price).toLocaleString('en-IN')} <span>/ {product.priceUnit}</span></div><p className="stock-line">{product.quantity} {product.quantityUnit} available · Minimum order {product.minimumOrderQuantity} {product.quantityUnit}</p><p className="detail-description">{product.description || 'Freshly harvested produce, grown with care and ready for your table.'}</p><div className="detail-facts"><div><small>HARVESTED</small><b>{product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : 'Fresh this season'}</b></div><div><small>SEASON</small><b>{product.season || 'Seasonal'}</b></div></div><div className="detail-farmer"><div className="farmer-avatar">{farmer.name?.[0] || 'F'}</div><div><small>GROWN BY</small><Link to={`/farmer/${farmer._id}`}>{farmer.name}</Link><div className="farmer-rating"><span>★ {Number(farmer.rating || 0).toFixed(1)}</span> · {farmer.district} {farmer.isVerified && <><BadgeCheck size={15} className="verified-icon" /> Verified farmer</>}</div></div></div><div className="detail-buy"><div className="qty-picker"><button disabled={product.quantity < product.minimumOrderQuantity} onClick={() => setQty(Math.max(product.minimumOrderQuantity || 1, qty - 1))}>−</button><span>{qty}</span><button disabled={product.quantity < product.minimumOrderQuantity} onClick={() => setQty(Math.min(product.quantity, qty + 1))}>+</button><small>{product.quantityUnit}</small></div><button className="button button-primary" disabled={product.status !== 'ACTIVE' || product.quantity < product.minimumOrderQuantity} onClick={buyNow}>Buy now · ₹{(qty * product.price).toLocaleString('en-IN')}</button><button className="button button-outline" disabled={product.status !== 'ACTIVE' || product.quantity < product.minimumOrderQuantity} onClick={() => { try { add(product, Number(qty)); } catch (err) { window.alert(err.message); } }}>Add to basket</button></div></section></div></div>;
}

export function FarmerPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => { getFarmer(id).then(({ data: result }) => setData(result)).catch(() => setError(true)); }, [id]);
  if (error) return <div className="page-container"><ErrorState message="Farmer profile unavailable." /></div>;
  if (!data) return <LoadingState />;
  const { farmer, products, reviews, completedOrders } = data;
  return <div className="page-container farmer-profile-page"><section className="farmer-profile-hero"><div className="profile-avatar">{farmer.profileImage ? <img src={mediaUrl(farmer.profileImage)} alt="" /> : farmer.name[0]}</div><div><div className="eyebrow">MEET YOUR LOCAL GROWER</div><h1>{farmer.name} {farmer.isVerified && <BadgeCheck className="verified-icon" />}</h1><p><MapPin size={16} /> {farmer.farmLocation || farmer.district}, {farmer.state}</p><div className="profile-stats"><span><b>★ {Number(farmer.rating || 0).toFixed(1)}</b> farmer rating</span><span><b>{completedOrders}</b> completed orders</span><span><b>{products.length}</b> active listings</span></div></div></section><section className="section-sub"><h2>Fresh from this farm</h2>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <EmptyState>No active produce listings.</EmptyState>}</section><section className="section-sub"><h2>What buyers say</h2>{reviews.length ? <div className="review-grid">{reviews.map((review) => <article className="review-card" key={review._id}><div className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p>{review.comment || 'A great experience buying direct from this farmer.'}</p><small>{review.buyer?.name || 'Buyer'} · {new Date(review.createdAt).toLocaleDateString()}</small></article>)}</div> : <EmptyState>Reviews will show here once orders are delivered.</EmptyState>}</section></div>;
}

export function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: params.get('role') || 'buyer', buyerType: 'individual' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from?.pathname || (user?.role === 'admin' ? '/admin' : `/${user?.role}/dashboard`);
  useEffect(() => { if (user) navigate(redirectPath, { replace: true }); }, [user, navigate, redirectPath]);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const current = isRegister ? await register(form) : await login({ email: form.email, password: form.password });
      const destination = current.role === 'admin' ? '/admin' : `/${current.role}/dashboard`;
      navigate(location.state?.from?.pathname || destination, { replace: true });
    } catch (err) { setError(err.response?.data?.message || 'Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-art"><div className="eyebrow light">GOOD FOOD. GOOD PEOPLE.</div><h2>A closer connection<br />to <em>what nourishes us.</em></h2><p>Join the growing community bringing farms and tables closer together.</p><div className="auth-art-note"><Sprout /> GROWN WITH CARE IN TAMIL NADU</div></div><div className="auth-card-wrap"><form className="auth-card" onSubmit={submit}><div className="eyebrow">{isRegister ? 'YOUR COMMUNITY STARTS HERE' : 'WELCOME BACK'}</div><h1>{isRegister ? 'Create your account' : 'Good to see you again.'}</h1><p>{isRegister ? 'A few details and you’re on your way.' : 'Sign in to continue to FarmLink.'}</p>{isRegister && <><label className="form-label">I want to <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="buyer">Shop for fresh food</option><option value="farmer">Sell my produce</option></select></label><label className="form-label">Your name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label className="form-label">Phone number<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>{form.role === 'buyer' && <label className="form-label">Buyer type<select value={form.buyerType} onChange={(e) => setForm({ ...form, buyerType: e.target.value })}><option value="individual">Individual</option><option value="retailer">Retailer</option><option value="bulk">Bulk buyer</option></select></label>}</>}<label className="form-label">Email address<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label className="form-label">Password<input type="password" required minLength="8" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create my account' : 'Sign in'} <ArrowRight size={17} /></button><p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to FarmLink?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>{!isRegister && <div className="demo-hint">Demo: farmer@example.com / Farmer@123</div>}</form></div></div>;
}

export function AboutPage() {
  return <div className="page-container about-page"><div className="eyebrow">A BETTER WAY TO SHARE GOOD FOOD</div><h1>Shortening the distance<br />between <em>farm and table.</em></h1><p>FarmLink gives growers a direct place to share their harvest and gives buyers a transparent way to discover local food. We’re building a more open, fair, and resilient food system — one connection at a time.</p><div className="about-values">{[['Trust','Verified farmer profiles and honest reviews help every connection start with confidence.'],['Transparency','Clear prices and indicative market references give both sides more context.'],['Community','Local discovery makes it easier to keep more value close to the people who grow it.']].map(([title,text]) => <article key={title}><ShieldCheck /><h3>{title}</h3><p>{text}</p></article>)}</div></div>;
}
