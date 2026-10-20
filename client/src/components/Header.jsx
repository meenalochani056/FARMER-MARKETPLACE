import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBasket, Bell, Menu, X, Sprout, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const roleHome = user ? user.role === 'admin' ? '/admin' : `/${user.role}/dashboard` : '/';
  const dashboardPath = user?.role === 'admin' ? '/admin' : `/${user?.role}/dashboard`;
  return <header className="site-header">
    <div className="header-inner">
      <Link className="brand" to={roleHome}><span className="brand-mark"><Sprout size={21} /></span><span>farm<span>link</span><small>FRESH, FAIR, DIRECT.</small></span></Link>
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      <nav className={open ? 'main-nav open' : 'main-nav'}>
        <NavLink to="/marketplace" onClick={() => setOpen(false)}>Marketplace</NavLink>
        <a href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a>
        <NavLink to="/market-prices" onClick={() => setOpen(false)}>Market prices</NavLink>
        {user && <NavLink to={dashboardPath} onClick={() => setOpen(false)}>Dashboard</NavLink>}
        <div className="nav-actions">
          {user?.role === 'buyer' && <Link className="icon-link" to="/buyer/cart" aria-label="Cart"><ShoppingBasket size={19} /><span className="count-badge">{count}</span></Link>}
          {user && <Link className="icon-link" to={`/${user.role}/notifications`} aria-label="Notifications"><Bell size={19} /></Link>}
          {user ? <div className="account-menu"><button className="account-button">{user.name.split(' ')[0]} <ChevronDown size={15} /></button><div className="account-dropdown"><Link to={`/${user.role}/profile`}>My profile</Link><button onClick={() => { logout(); navigate('/'); }}>Sign out</button></div></div> : <><Link className="text-link" to="/login">Sign in</Link><Link className="button button-small" to="/register">Join FarmLink</Link></>}
        </div>
      </nav>
    </div>
  </header>;
}
