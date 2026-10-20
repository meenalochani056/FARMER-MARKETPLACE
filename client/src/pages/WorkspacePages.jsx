import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Bell, Check, ChevronRight, CircleDollarSign, ClipboardList, Package, Plus, Save, ShoppingBasket, Sprout, Star, Truck, UserRound } from 'lucide-react';
import api, { mediaUrl, messageFromError } from '../services/api';
import { getCategories, getProducts, removeProduct, saveProduct } from '../services/productService';
import { getOrders, getOrder, placeOrder, updateOrder, createPayment, verifyPayment, getTracking, updateTracking } from '../services/orderService';
import { getMarketPrices, saveMarketPrice } from '../services/marketPriceService';
import { createReview } from '../services/reviewService';
import { getNotifications, markNotificationRead } from '../services/notificationService';
import { updateProfile } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/PageStates';
import { fallbackProductImage, productImage } from '../utils/productImage';

const money = (amount = 0) => `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const deliveryFor = (items) => {
  const totals = new Map();
  for (const item of items) {
    const farmerId = item.farmer?._id || 'farm';
    totals.set(farmerId, (totals.get(farmerId) || 0) + item.price * item.quantity);
  }
  return [...totals.values()].reduce((sum, amount) => sum + (amount >= 1000 ? 0 : 60), 0);
};
function PageTitle({ eyebrow, title, action }) { return <div className="workspace-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div>{action}</div>; }
function StatCard({ icon: Icon, label, value, note }) { return <div className="stat-card"><span className="stat-icon"><Icon size={19} /></span><span className="stat-label">{label}</span><b>{value}</b>{note && <small>{note}</small>}</div>; }

export function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const calls = [getOrders()];
    if (user.role === 'farmer') calls.push(getProducts({ farmer: user._id, limit: 100, availability: 'all' }));
    if (user.role === 'admin') calls.push(api.get('/admin/stats'));
    Promise.all(calls).then((responses) => {
      setOrders(responses[0].data.orders);
      if (user.role === 'farmer') setProducts(responses[1].data.products);
      if (user.role === 'admin') setStats(responses[1].data.stats);
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [user]);
  if (error) return <div className="workspace"><ErrorState /></div>;
  if (loading) return <div className="workspace"><LoadingState /></div>;
  const complete = orders.filter((order) => order.orderStatus === 'DELIVERED').length;
  const active = orders.filter((order) => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(order.orderStatus)).length;
  if (user.role === 'admin') return <div className="workspace"><PageTitle eyebrow="PLATFORM OVERVIEW" title={`Good morning, ${user.name.split(' ')[0]}.`} action={<Link to="/admin/farmers" className="button button-primary">Review farmers <ChevronRight size={16} /></Link>} />{!stats ? <LoadingState /> : <><div className="stats-grid"><StatCard icon={Sprout} label="Total farmers" value={stats.farmers} /><StatCard icon={BadgeCheck} label="Verified farmers" value={stats.verifiedFarmers} /><StatCard icon={UserRound} label="Total buyers" value={stats.buyers} /><StatCard icon={Package} label="Active products" value={stats.products} /><StatCard icon={ClipboardList} label="Total orders" value={stats.orders} /><StatCard icon={Check} label="Completed orders" value={stats.completedOrders} /><StatCard icon={CircleDollarSign} label="Paid revenue" value={money(stats.revenue)} /><StatCard icon={Bell} label="Needs verification" value={stats.pendingVerification} /></div><AdminLinks /></>}</div>;
  const recent = orders.slice(0, 5);
  const sales = orders.filter((order) => order.paymentStatus === 'PAID').reduce((sum, order) => sum + order.totalAmount, 0);
  return <div className="workspace"><PageTitle eyebrow={user.role === 'farmer' ? 'YOUR FARM AT A GLANCE' : 'YOUR FARMlink HOME'} title={`Good morning, ${user.name.split(' ')[0]}.`} action={user.role === 'farmer' && <Link className="button button-primary" to="/farmer/products/new"><Plus size={17} /> Add produce</Link>} />
    <div className="welcome-banner"><div><span>{user.role === 'farmer' ? 'YOUR GROWING SEASON' : 'A LITTLE GOODNESS, GROWING'}</span><h2>{user.role === 'farmer' ? 'Your harvest has a market.' : 'Good food is just around the corner.'}</h2><p>{user.role === 'farmer' ? (user.isVerified ? 'Your verified profile is helping buyers shop with confidence.' : 'Your profile is awaiting verification. You can still prepare your listings.') : 'Discover fresh produce from farmers in your community.'}</p></div><Link to={user.role === 'farmer' ? '/farmer/products' : '/marketplace'} className="button button-cream">{user.role === 'farmer' ? 'Manage listings' : 'Explore produce'} <ChevronRight size={16} /></Link></div>
    <div className="stats-grid">{user.role === 'farmer' ? <><StatCard icon={Package} label="Total products" value={products.length} /><StatCard icon={Check} label="Active listings" value={products.filter((product) => product.status === 'ACTIVE').length} /><StatCard icon={ClipboardList} label="Open orders" value={active} /><StatCard icon={Sprout} label="Completed orders" value={complete} /><StatCard icon={CircleDollarSign} label="Sales" value={money(sales)} /><StatCard icon={Star} label="Farmer rating" value={Number(user.rating || 0).toFixed(1)} note={`${user.ratingCount || 0} buyer reviews`} /></> : <><StatCard icon={ClipboardList} label="Total orders" value={orders.length} /><StatCard icon={Truck} label="Active orders" value={active} /><StatCard icon={Check} label="Completed orders" value={complete} /><StatCard icon={ShoppingBasket} label="Basket items" value={<Link to="/buyer/cart">Shop now <ChevronRight size={14} /></Link>} /></>}</div>
    <div className="workspace-section-heading"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>Recent orders</h2></div><Link to={`/${user.role}/orders`} className="arrow-link">All orders <ChevronRight size={16} /></Link></div>
    {recent.length ? <OrdersTable orders={recent} viewer={user.role} /> : <EmptyState>{user.role === 'farmer' ? 'No orders yet. Your next harvest could be someone’s favourite meal.' : "You don't have any orders yet."}</EmptyState>}
    {user.role === 'buyer' && <RecommendedProduce />}
  </div>;
}

function AdminLinks() {
  return <div className="admin-link-grid">{[['Farmers','/admin/farmers'],['Buyers','/admin/buyers'],['Products','/admin/products'],['Orders','/admin/orders'],['Payments','/admin/payments'],['Logistics','/admin/logistics'],['Reviews','/admin/reviews'],['Categories','/admin/categories'],['Market prices','/admin/market-prices']].map(([name,url]) => <Link key={url} to={url}>{name}<ChevronRight size={16} /></Link>)}</div>;
}
function RecommendedProduce() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => { getProducts({ limit: 4 }).then(({ data }) => setProducts(data.products)).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  return <section className="workspace-recommend"><div className="workspace-section-heading"><div><div className="eyebrow">FRESH FROM THE FARM</div><h2>A few good things</h2></div><Link to="/marketplace" className="arrow-link">Explore all <ChevronRight size={16} /></Link></div>{error ? <ErrorState /> : loading ? <LoadingState /> : products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div> : <EmptyState>No products found.</EmptyState>}</section>;
}

function OrdersTable({ orders, viewer }) {
  return <div className="table-wrap"><table><thead><tr><th>Order</th><th>{viewer === 'farmer' ? 'Buyer' : 'Farmer'}</th><th>Placed</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><Link to={`/${viewer}/orders/${order._id}`}>#{order._id.slice(-7).toUpperCase()}</Link></td><td>{viewer === 'farmer' ? order.buyer?.name : order.farmer?.name}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>{money(order.totalAmount)}</td><td><span className={`status-pill status-${order.orderStatus.toLowerCase()}`}>{order.orderStatus.replaceAll('_',' ')}</span></td><td><Link to={`/${viewer}/orders/${order._id}`} className="table-action">View</Link></td></tr>)}</tbody></table></div>;
}

export function CartPage() {
  const { items, subtotal, setQuantity, remove } = useCart();
  const delivery = deliveryFor(items);
  return <div className="workspace"><PageTitle eyebrow="YOUR BASKET" title="Good things, gathered." action={<Link className="button button-outline" to="/marketplace">Keep browsing</Link>} />
    {items.length ? <div className="cart-layout"><div className="cart-lines">{items.map((item) => <article className="cart-line" key={item._id}><img src={mediaUrl(productImage(item))} alt={item.name} onError={(event) => fallbackProductImage(event, item)} /><div className="cart-line-info"><Link to={`/products/${item._id}`}>{item.name}</Link><span>{money(item.price)} / {item.priceUnit}</span><button className="remove-link" onClick={() => remove(item._id)}>Remove</button></div><div className="qty-picker"><button onClick={() => setQuantity(item._id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button disabled={item.quantity >= item.availableQuantity} onClick={() => setQuantity(item._id, item.quantity + 1)}>+</button></div><b>{money(item.price * item.quantity)}</b></article>)}</div><aside className="order-summary"><h2>Your order</h2><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Delivery</span><b>{delivery ? money(delivery) : 'Free'}</b></div><p>{subtotal < 1000 ? 'Free delivery on orders over ₹1,000.' : 'You’ve unlocked free delivery.'}</p><div className="summary-total"><span>Total</span><b>{money(subtotal + delivery)}</b></div><Link to="/buyer/checkout" className="button button-primary full-button">Continue to checkout <ChevronRight size={17} /></Link><small>Demo checkout uses simulated payments only.</small></aside></div> : <EmptyState>Your cart is empty. <Link to="/marketplace">Find something fresh.</Link></EmptyState>}
  </div>;
}

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [method, setMethod] = useState('DEMO');
  const [address, setAddress] = useState({ name: user.name, phone: user.phone || '', line1: user.address || '', city: user.district || '', district: user.district || '', state: user.state || 'Tamil Nadu', postalCode: '' });
  const delivery = deliveryFor(items);
  useEffect(() => { if (!items.length && step < 4) navigate('/buyer/cart', { replace: true }); }, [items.length, navigate, step]);
  async function place() {
    setBusy(true); setError('');
    try {
      const result = await placeOrder({ items: items.map((item) => ({ product: item._id, quantity: item.quantity })), deliveryAddress: address });
      setOrders(result.data.orders);
      for (const order of result.data.orders) {
        const payment = await createPayment(order._id, method);
        await verifyPayment(payment.data.payment._id, true);
      }
      clear(); setStep(4);
    } catch (err) { setError(messageFromError(err)); }
    finally { setBusy(false); }
  }
  if (step === 4) return <div className="checkout-success"><div className="success-icon"><Check size={32} /></div><div className="eyebrow">THANK YOU FOR BUYING DIRECT</div><h1>Your order is on its way.</h1><p>Your demo payment was recorded successfully. No money was transferred.</p>{orders.map((order) => <div className="success-order" key={order._id}><span>Order #{order._id.slice(-7).toUpperCase()}</span><b>{money(order.totalAmount)}</b><span>PAID · CONFIRMED</span><Link to={`/buyer/orders/${order._id}`}>Track this order</Link></div>)}<Link className="button button-primary" to="/buyer/orders">View all orders</Link></div>;
  return <div className="workspace checkout-page"><PageTitle eyebrow="A FEW LAST DETAILS" title="Let’s get this to you." /><div className="checkout-steps">{['Delivery','Review','Payment'].map((label,index) => <div className={step >= index + 1 ? 'active' : ''} key={label}><span>{index + 1 < step ? <Check size={14} /> : index + 1}</span>{label}</div>)}</div><div className="checkout-layout"><section className="checkout-main">{step === 1 && <div className="panel"><h2>Where should we deliver?</h2><p>Your details are shared only with the farmer fulfilling your order.</p><div className="form-grid">{[['name','Full name'],['phone','Phone number'],['line1','Address'],['city','City / town'],['district','District'],['state','State'],['postalCode','PIN code']].map(([key,label]) => <label className="form-label" key={key}>{label}<input required value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} /></label>)}</div><button className="button button-primary" onClick={() => setStep(2)}>Review order <ChevronRight size={16} /></button></div>}{step === 2 && <div className="panel"><h2>Take a look at your basket.</h2>{items.map((item) => <div className="checkout-item" key={item._id}><span>{item.quantity} × {item.name}</span><b>{money(item.price * item.quantity)}</b></div>)}<div className="checkout-address"><b>Delivering to</b><p>{address.name}<br />{address.line1}, {address.city}, {address.district}, {address.state} {address.postalCode}<br />{address.phone}</p></div><div className="panel-actions"><button className="button button-outline" onClick={() => setStep(1)}>Edit address</button><button className="button button-primary" onClick={() => setStep(3)}>Continue to payment</button></div></div>}{step === 3 && <div className="panel"><h2>Choose a demo payment.</h2><p>This is a simulated payment for project demonstration only. No real money is transferred.</p>{[['DEMO','Demo payment','Quick simulated checkout'],['UPI','UPI (demo)','Simulated UPI payment'],['CARD','Card (demo)','Simulated card payment']].map(([value,label,caption]) => <label className={`payment-option ${method === value ? 'selected' : ''}`} key={value}><input type="radio" checked={method === value} onChange={() => setMethod(value)} /><span><b>{label}</b><small>{caption}</small></span><Check size={18} /></label>)}{error && <p className="form-error">{error}</p>}<div className="panel-actions"><button className="button button-outline" onClick={() => setStep(2)}>Back</button><button disabled={busy} className="button button-primary" onClick={place}>{busy ? 'Processing…' : `Pay ${money(subtotal + delivery)}`} <ChevronRight size={16} /></button></div></div>}</section><aside className="order-summary"><h2>Order total</h2><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Delivery</span><b>{delivery ? money(delivery) : 'Free'}</b></div><div className="summary-total"><span>Total</span><b>{money(subtotal + delivery)}</b></div><small>Secure checkout · demo payment only</small></aside></div></div>;
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = () => { setLoading(true); getOrders().then(({ data }) => setOrders(data.orders)).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(load, []);
  return <div className="workspace"><PageTitle eyebrow="YOUR ORDER HISTORY" title={user.role === 'farmer' ? 'Orders from your farm.' : 'Your orders.'} />{loading ? <LoadingState /> : error ? <ErrorState onRetry={load} /> : orders.length ? <OrdersTable orders={orders} viewer={user.role} /> : <EmptyState>{user.role === 'farmer' ? 'No orders yet.' : "You don't have any orders yet."}</EmptyState>}</div>;
}

const statusOptions = {
  PENDING: ['CONFIRMED','REJECTED'], CONFIRMED: ['PROCESSING','CANCELLED'], PROCESSING: ['READY_FOR_PICKUP','CANCELLED'],
  READY_FOR_PICKUP: [], PICKED_UP: [], OUT_FOR_DELIVERY: []
};
const logisticsStatus = ['PICKUP_SCHEDULED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'];
export function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  async function load() {
    const { data } = await getOrder(id); setOrder(data.order);
    const response = await getTracking(id);
    setTracking(response.data.logistics);
  }
  useEffect(() => { load().catch((err) => setError(messageFromError(err))); }, [id]);
  async function changeStatus(status) {
    setError('');
    try { await updateOrder(id, status); await load(); } catch (err) { setError(messageFromError(err)); }
  }
  async function changeDeliveryStatus(status) {
    setError('');
    try {
      if (!tracking) { await api.post('/logistics', { orderId: id }); }
      const current = tracking || (await getTracking(id)).data.logistics;
      if (current) await updateTracking(id, status);
      await load();
    } catch (err) { setError(messageFromError(err)); }
  }
  async function submitReview(event) {
    event.preventDefault(); setError('');
    try { await createReview({ order: order._id, rating, comment }); setReviewed(true); }
    catch (err) { setError(messageFromError(err)); }
  }
  if (error && !order) return <div className="workspace"><ErrorState message={error} /></div>;
  if (!order) return <LoadingState />;
  const available = user.role === 'farmer' ? statusOptions[order.orderStatus] || [] : [];
  return <div className="workspace order-detail-page"><Link className="back-link" to={`/${user.role}/orders`}>← Back to orders</Link><PageTitle eyebrow={`ORDER #${order._id.slice(-7).toUpperCase()}`} title="A little closer to your table." /><div className="order-detail-grid"><section className="panel"><div className="order-status-head"><div><div className="eyebrow">CURRENT STATUS</div><h2>{order.orderStatus.replaceAll('_',' ')}</h2></div><span className={`status-pill status-${order.paymentStatus.toLowerCase()}`}>{order.paymentStatus}</span></div><div className="order-timeline">{['PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'].map((status) => <span className={['PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED'].indexOf(order.orderStatus) >= ['PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'].indexOf(status) && !['CANCELLED','REJECTED'].includes(order.orderStatus) ? 'done' : ''} key={status}><i />{status.replaceAll('_',' ')}</span>)}</div>{available.length > 0 && <div className="order-controls"><b>Update order</b>{available.map((status) => <button key={status} className={`button ${status === 'CANCELLED' || status === 'REJECTED' ? 'button-outline' : 'button-primary'}`} onClick={() => changeStatus(status)}>{status.replaceAll('_',' ')}</button>)}</div>}{error && <p className="form-error">{error}</p>}<h3>Items in this order</h3>{order.items.map((item) => <div className="checkout-item" key={item._id || item.product}><span>{item.quantity} {item.unit} × {item.name}</span><b>{money(item.price * item.quantity)}</b></div>)}<div className="checkout-address"><b>Delivery address</b><p>{order.deliveryAddress.name}<br />{order.deliveryAddress.line1}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p></div></section><aside className="panel"><h3>Order summary</h3><div className="summary-line"><span>Subtotal</span><b>{money(order.subtotal)}</b></div><div className="summary-line"><span>Delivery</span><b>{money(order.deliveryFee)}</b></div><div className="summary-total"><span>Total</span><b>{money(order.totalAmount)}</b></div><div className="order-contact"><small>{user.role === 'farmer' ? 'BUYER' : 'GROWN BY'}</small><b>{user.role === 'farmer' ? order.buyer?.name : order.farmer?.name}</b></div>{tracking && <div className="tracking-box"><div className="eyebrow">DEMO DELIVERY TRACKING</div><b>{tracking.trackingId}</b><span>{tracking.status.replaceAll('_',' ')}</span>{user.role === 'farmer' && order.orderStatus === 'READY_FOR_PICKUP' && <select value={tracking.status} onChange={(e) => changeDeliveryStatus(e.target.value)}>{logisticsStatus.map((status) => <option value={status} key={status}>{status.replaceAll('_',' ')}</option>)}</select>}</div>}{user.role === 'buyer' && order.orderStatus === 'DELIVERED' && !reviewed && <form className="review-form" onSubmit={submitReview}><h3>How was your experience?</h3><label>Rating<select value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5,4,3,2,1].map((number) => <option value={number} key={number}>{number} stars</option>)}</select></label><textarea placeholder="Share a note for this farmer…" value={comment} onChange={(e) => setComment(e.target.value)} /><button className="button button-primary">Leave a review</button></form>}{reviewed && <p className="success-message">Thank you for sharing your experience.</p>}</aside></div></div>;
}

export function ProductManagementPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', category: '', description: '', price: '', priceUnit: 'kg', quantity: '', quantityUnit: 'kg', minimumOrderQuantity: 1, location: '', district: '', state: 'Tamil Nadu', harvestDate: '', season: '', isOrganic: false, status: 'ACTIVE' });
  const [images, setImages] = useState([]);
  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.categories)).catch(() => setError('Unable to load categories.'));
    getMarketPrices().then(({ data }) => setMarketPrices(data.marketPrices)).catch(() => setError('Unable to load market-price references.'));
    getProducts({ limit: 100, availability: 'all' }).then(({ data }) => setProducts(data.products)).catch(() => setError('Unable to load your products. Please try again.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (id) api.get(`/products/${id}`).then(({ data }) => setForm({ ...form, ...data.product, category: data.product.category?._id || data.product.category, harvestDate: data.product.harvestDate?.slice(0,10) || '' })).catch((err) => setError(messageFromError(err))); }, [id]);
  async function submit(event) {
    event.preventDefault(); setError('');
    const body = new FormData();
    for (const [key, value] of Object.entries(form)) if (!['_id', 'farmer', 'images', 'createdAt', 'updatedAt'].includes(key)) body.append(key, value);
    images.forEach((image) => body.append('images', image));
    try {
      const { data } = await saveProduct(body, id);
      if (!id) setProducts((current) => [data.product, ...current]);
      else setProducts((current) => current.map((product) => product._id === id ? data.product : product));
      navigate('/farmer/products');
    }
    catch (err) { setError(messageFromError(err)); }
  }
  async function remove(productId) {
    if (!window.confirm('Remove this listing from the marketplace?')) return;
    try { await removeProduct(productId); setProducts(products.filter((product) => product._id !== productId)); }
    catch (err) { setError(messageFromError(err)); }
  }
  if (id || location.pathname.endsWith('/new')) return <div className="workspace"><PageTitle eyebrow="FARMER TOOLKIT" title="Put your harvest out there." /><ProductForm form={form} setForm={setForm} categories={categories} marketPrices={marketPrices} images={images} setImages={setImages} error={error} submit={submit} /></div>;
  return <div className="workspace"><PageTitle eyebrow="YOUR FARM STAND" title="Your produce listings." action={<Link className="button button-primary" to="/farmer/products/new"><Plus size={16} /> Add produce</Link>} />{error && <p className="form-error">{error}</p>}{loading ? <LoadingState /> : products.length ? <div className="table-wrap"><table><thead><tr><th>Produce</th><th>Price</th><th>Available</th><th>Status</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="table-product"><img src={mediaUrl(productImage(product))} alt="" onError={(event) => fallbackProductImage(event, product)} /><span>{product.name}<small>{product.category?.name}</small></span></div></td><td>{money(product.price)} / {product.priceUnit}</td><td>{product.quantity} {product.quantityUnit}</td><td><span className="status-pill">{product.status}</span></td><td><Link className="table-action" to={`/farmer/products/${product._id}/edit`}>Edit</Link><button className="table-action danger-link" onClick={() => remove(product._id)}>Remove</button></td></tr>)}</tbody></table></div> : <EmptyState>No listings yet. Add your first produce listing.</EmptyState>}</div>;
}

function ProductForm({ form, setForm, categories, marketPrices, images, setImages, error, submit }) {
  const fields = [['name','Produce name'],['price','Price per unit'],['quantity','Available quantity'],['minimumOrderQuantity','Minimum order'],['location','Farm / pickup location'],['district','District'],['state','State'],['harvestDate','Harvest date'],['season','Season']];
  const marketReference = marketPrices.find((price) => price.crop.toLowerCase() === String(form.name || '').trim().toLowerCase() && price.unit === (form.priceUnit || 'kg'));
  return <form className="panel product-form" onSubmit={submit}><div className="form-grid">{fields.map(([key,label]) => <label className="form-label" key={key}>{label}<input required={['name','price','quantity','minimumOrderQuantity'].includes(key)} type={['price','quantity','minimumOrderQuantity'].includes(key) ? 'number' : key === 'harvestDate' ? 'date' : 'text'} min={['price','quantity','minimumOrderQuantity'].includes(key) ? '0.01' : undefined} step="any" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}<label className="form-label">Category<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Select category</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select></label><label className="form-label">Price unit<select value={form.priceUnit} onChange={(e) => setForm({ ...form, priceUnit: e.target.value, quantityUnit: e.target.value })}>{['kg','piece','dozen','bundle','quintal'].map((unit) => <option key={unit}>{unit}</option>)}</select></label><label className="form-label">Availability<select value={form.status || 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Available</option><option value="UNAVAILABLE">Temporarily unavailable</option></select></label><label className="form-label full-span">Description<textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label className="form-label full-span">Produce photos<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => setImages([...e.target.files])} /><small>JPG, PNG or WebP · up to 5 MB per image</small></label><label className="check-label full-span"><input type="checkbox" checked={Boolean(form.isOrganic)} onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })} /> Naturally grown / organic</label></div>{marketReference && <div className="market-comparison"><b>Indicative market reference · {marketReference.market}, {marketReference.location}</b><span>Your listing: ₹{Number(form.price || 0)} / {form.priceUnit} · Range: ₹{marketReference.minimumPrice}–₹{marketReference.maximumPrice} / {marketReference.unit} · Average ₹{marketReference.averagePrice}</span><small>Demo data only, not real-time pricing.</small></div>}{error && <p className="form-error">{error}</p>}<button className="button button-primary"><Save size={16} /> Publish listing</button></form>;
}

export function MarketPricesPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState([]);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ crop: '', market: '', location: '', minimumPrice: '', maximumPrice: '', averagePrice: '', unit: 'kg' });
  const load = () => getMarketPrices().then(({ data }) => setPrices(data.marketPrices)).catch(() => setError(true));
  useEffect(() => { load(); }, []);
  async function submit(event) {
    event.preventDefault();
    try { await saveMarketPrice(form); setForm({ crop: '', market: '', location: '', minimumPrice: '', maximumPrice: '', averagePrice: '', unit: 'kg' }); load(); }
    catch { setError(true); }
  }
  return <div className="workspace"><PageTitle eyebrow="A REFERENCE FOR BETTER DECISIONS" title="The market, in context." /><div className="demo-banner"><Sprout size={19} /><span><b>Indicative demo prices.</b> These seeded values are for demonstration only. They are not live or government-reported market rates.</span></div>{error ? <ErrorState onRetry={load} /> : prices.length ? <div className="table-wrap prices-table"><table><thead><tr><th>Crop</th><th>Market</th><th>Location</th><th>Min price</th><th>Average</th><th>Max price</th><th>Updated</th></tr></thead><tbody>{prices.map((price) => <tr key={price._id}><td><b>{price.crop}</b>{price.isDemoData && <small className="demo-chip">DEMO</small>}</td><td>{price.market}</td><td>{price.location}</td><td>{money(price.minimumPrice)} / {price.unit}</td><td><b>{money(price.averagePrice)} / {price.unit}</b></td><td>{money(price.maximumPrice)} / {price.unit}</td><td>{new Date(price.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <EmptyState>No market-price references yet.</EmptyState>}{user?.role === 'farmer' && <section className="price-guidance"><h2>Put your listing in context</h2><p>Compare your selling price with the indicative range for your crop and market. Rates can change with quality, grade, season, and location.</p></section>}{user?.role === 'admin' && <form className="panel market-price-form" onSubmit={submit}><h2>Add an indicative market price</h2><div className="form-grid">{[['crop','Crop'],['market','Market'],['location','Location'],['minimumPrice','Minimum price'],['averagePrice','Average price'],['maximumPrice','Maximum price'],['unit','Unit']].map(([key,label]) => <label className="form-label" key={key}>{label}<input required type={key.includes('Price') ? 'number' : 'text'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}</div><button className="button button-primary">Add demo price</button></form>}</div>;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); getNotifications().then(({ data }) => setItems(data.notifications)).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  async function read(id) { try { const { data } = await markNotificationRead(id); setItems(items.map((item) => item._id === id ? data.notification : item)); } catch { setError(true); } }
  return <div className="workspace"><PageTitle eyebrow="A NOTE FROM YOUR COMMUNITY" title="Your notifications." />{error ? <ErrorState onRetry={load} /> : loading ? <LoadingState /> : items.length ? <div className="notification-list">{items.map((item) => <article key={item._id} className={item.isRead ? 'notification-item read' : 'notification-item'}><div className="notification-icon"><Bell size={18} /></div><div><b>{item.title}</b><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div>{!item.isRead && <button className="table-action" onClick={() => read(item._id)}>Mark read</button>}</article>)}</div> : <EmptyState>You’re all caught up. New updates will show here.</EmptyState>}</div>;
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', farmLocation: user.farmLocation || '', district: user.district || '', state: user.state || 'Tamil Nadu', address: user.address || '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      const image = event.currentTarget.profileImage.files[0];
      if (image) body.append('profileImage', image);
      await updateProfile(body); await refreshUser(); setMessage('Your profile has been updated.');
    } catch (err) { setError(messageFromError(err)); }
  }
  return <div className="workspace"><PageTitle eyebrow="YOUR FARMlink PROFILE" title="A little more about you." /><form onSubmit={submit} className="panel profile-form"><div className="form-grid">{[['name','Name'],['phone','Phone'],['farmLocation','Farm / pickup location'],['district','District'],['state','State'],['address','Address']].map(([key,label]) => <label className="form-label" key={key}>{label}<input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}<label className="form-label full-span">Profile photo<input name="profileImage" type="file" accept="image/png,image/jpeg,image/webp" /><small>Image upload is stored locally during development.</small></label></div>{user.role === 'farmer' && <div className="verification-note">{user.isVerified ? <><BadgeCheck size={18} /> ✓ Verified Farmer</> : <><Bell size={18} /> Verification status: {user.verificationStatus || 'Pending'}. An admin will review your profile.</>}</div>}{message && <p className="success-message">{message}</p>}{error && <p className="form-error">{error}</p>}<button className="button button-primary"><Save size={16} /> Save profile</button></form></div>;
}
