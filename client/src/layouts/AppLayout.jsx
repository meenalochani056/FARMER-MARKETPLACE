import { Link, Outlet } from 'react-router-dom';
import Header from '../components/Header';
export default function AppLayout() {
  return <><Header /><main><Outlet /></main><footer className="site-footer"><div className="footer-content"><div><div className="brand footer-brand">🌱 <span>farmlink<small>FRESH, FAIR, DIRECT.</small></span></div><p>Better connections make a better food system.</p></div><div className="footer-links"><Link to="/marketplace">Marketplace</Link><Link to="/about">Our story</Link><Link to="/market-prices">Market prices</Link><Link to="/register">Join the community</Link></div><small>© 2026 FarmLink. Grown with care in Tamil Nadu.</small></div></footer></>;
}
