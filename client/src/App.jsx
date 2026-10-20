import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import SiteLayout from './layouts/AppLayout';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import { AboutPage, AuthPage, FarmerPage, HomePage, MarketplacePage, ProductPage } from './pages/PublicPages';
import { CartPage, CheckoutPage, DashboardPage, MarketPricesPage, NotificationsPage, OrderDetailPage, OrdersPage, ProductManagementPage, ProfilePage } from './pages/WorkspacePages';
import AdminResourcePage from './pages/AdminResourcePage';
import AdminMarketPricesPage from './pages/AdminMarketPricesPage';

function AppRoutes() {
  return <Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="products/:id" element={<ProductPage />} />
      <Route path="farmer/:id" element={<FarmerPage />} />
      <Route path="market-prices" element={<MarketPricesPage />} />
      <Route path="login" element={<AuthPage />} />
      <Route path="register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="buyer" />}>
          <Route path="buyer/dashboard" element={<DashboardPage />} />
          <Route path="buyer/cart" element={<CartPage />} />
          <Route path="buyer/checkout" element={<CheckoutPage />} />
          <Route path="buyer/orders" element={<OrdersPage />} />
          <Route path="buyer/orders/:id" element={<OrderDetailPage />} />
          <Route path="buyer/profile" element={<ProfilePage />} />
          <Route path="buyer/notifications" element={<NotificationsPage />} />
        </Route>
        <Route element={<RoleRoute role="farmer" />}>
          <Route path="farmer/dashboard" element={<DashboardPage />} />
          <Route path="farmer/products" element={<ProductManagementPage />} />
          <Route path="farmer/products/new" element={<ProductManagementPage />} />
          <Route path="farmer/products/:id/edit" element={<ProductManagementPage />} />
          <Route path="farmer/orders" element={<OrdersPage />} />
          <Route path="farmer/orders/:id" element={<OrderDetailPage />} />
          <Route path="farmer/earnings" element={<DashboardPage />} />
          <Route path="farmer/market-prices" element={<MarketPricesPage />} />
          <Route path="farmer/profile" element={<ProfilePage />} />
          <Route path="farmer/notifications" element={<NotificationsPage />} />
        </Route>
        <Route element={<RoleRoute role="admin" />}>
          <Route path="admin" element={<DashboardPage />} />
          <Route path="admin/dashboard" element={<DashboardPage />} />
          <Route path="admin/profile" element={<ProfilePage />} />
          <Route path="admin/notifications" element={<NotificationsPage />} />
          <Route path="admin/market-prices" element={<AdminMarketPricesPage />} />
          <Route path="admin/:resource" element={<AdminResourcePage />} />
          <Route path="admin/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>;
}
export default function App() {
  return <BrowserRouter><AuthProvider><CartProvider><AppRoutes /></CartProvider></AuthProvider></BrowserRouter>;
}
