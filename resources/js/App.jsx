import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import About from './pages/About';
import Checkout from './pages/Checkout';
import Account, { WishlistPage } from './pages/Account';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { Empty } from './components/ui';
import { useAuth, useCart, useWishlist } from './store/shop';

function DetailRoute() {
  const { key } = useParams();
  return <ProductDetail key={key} />;
}

function Protected({ children, admin = false }) {
  const { user, token, fetchUser } = useAuth();
  useEffect(() => { if (token && !user) fetchUser(); }, []);
  if (!token) return <Navigate to="/profile" replace />;
  if (admin && user && !user.is_admin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { fetchUser, token } = useAuth();
  const fetchCart = useCart((s) => s.fetch);
  const fetchWish = useWishlist((s) => s.fetch);

  useEffect(() => {
    if (token) { fetchUser(); fetchWish(); }
    fetchCart();
    document.title = 'Baraclassica Garage';
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/shop" element={<Products />} />
          <Route path="/products/:key" element={<DetailRoute />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<Navigate to="/products" replace />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Navigate to="/profile" replace />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/account" element={<Protected><Account /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<Empty title="Halaman tidak ditemukan" action={<a className="btn btn--primary" href="/">Beranda</a>} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
