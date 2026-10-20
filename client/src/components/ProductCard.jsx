import { Link } from 'react-router-dom';
import { MapPin, Star, BadgeCheck, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { mediaUrl } from '../services/api';
import { fallbackProductImage, productImage } from '../utils/productImage';
export default function ProductCard({ product }) {
  const { add } = useCart();
  const farmer = product.farmer || {};
  const image = productImage(product);
  return <article className="product-card">
    <Link className="product-photo" to={`/products/${product._id}`}><img src={mediaUrl(image)} alt={product.name} loading="lazy" onError={(event) => fallbackProductImage(event, product)} />{product.isOrganic && <span className="organic-tag">Organic</span>}</Link>
    <div className="product-card-body">
      <div className="product-category">{product.category?.name || 'Fresh produce'}</div>
      <Link to={`/products/${product._id}`} className="product-name">{product.name}</Link>
      <div className="product-price">₹{Number(product.price).toLocaleString('en-IN')}<span> / {product.priceUnit}</span></div>
      <div className="product-meta"><span><MapPin size={13} /> {product.district || farmer.district || product.location || 'Tamil Nadu'}</span><span><Star size={13} fill="currentColor" /> {Number(farmer.rating || 4.8).toFixed(1)}</span></div>
      <div className="farmer-caption"><span>Grown by <Link to={`/farmer/${farmer._id}`}>{farmer.name || 'Local farmer'}</Link></span>{farmer.isVerified && <BadgeCheck size={16} className="verified-icon" />}</div>
      <button className="add-cart-button" disabled={product.status !== 'ACTIVE' || product.quantity < (Number(product.minimumOrderQuantity) || 1)} onClick={() => { try { add(product, Number(product.minimumOrderQuantity) || 1); } catch (error) { window.alert(error.message); } }}><Plus size={16} /> {product.status === 'ACTIVE' && product.quantity >= (Number(product.minimumOrderQuantity) || 1) ? 'Add to basket' : 'Unavailable'}</button>
    </div>
  </article>;
}
