import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { House, Search, Plus, User } from 'lucide-react';
import { Toasts } from './ui';
import ProductQuickView from './ProductQuickView';

export const WA_SELL_URL = 'https://wa.me/6283814559988?text=' + encodeURIComponent('Halo bos, saya mau jual vespa nih');

export function SearchInput({ onGo }) {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const go = () => {
    onGo?.();
    nav(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };
  return (
    <div className="search">
      <Search size={16} />
      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        aria-label="Cari Vespa klasik"
        onKeyDown={(e) => e.key === 'Enter' && go()}
      />
    </div>
  );
}

function TabBar() {
  const loc = useLocation();
  const nav = useNavigate();
  const is = (p) => (p === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p));
  const profileOn = ['/profile', '/admin'].some((p) => loc.pathname.startsWith(p));
  const tabs = [
    { p: '/', label: 'Beranda', icon: <House size={22} />, on: is('/') },
    { p: '/sell', label: 'Jual', icon: <Plus size={22} />, on: false, sell: true },
    { p: '/profile', label: 'Profil', icon: <User size={22} />, on: profileOn },
  ];
  return (
    <nav className="tabbar" aria-label="Navigasi Vespa">
      <div className="tabbar__in">
        {tabs.map((t) => (
          <button
            key={t.label} className={t.on ? 'active' : ''}
            onClick={() => {
              if (t.sell) return window.open(WA_SELL_URL, '_blank');
              nav(t.p);
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export function Layout({ children }) {
  const loc = useLocation();
  const hideChrome = loc.pathname.startsWith('/profile');
  return (
    <>
      {!hideChrome && (
        <div className="topbar">
          <div className="topbar__search"><SearchInput /></div>
        </div>
      )}
      <main className="wrap wrap--noheader">{children}</main>

      {!hideChrome && (
      <footer className="footer footer--social">
        <p className="copy">2026 | Baraclassica Garage</p>
      </footer>
      )}
      <TabBar />
      <Toasts />
      <ProductQuickView />
    </>
  );
}
