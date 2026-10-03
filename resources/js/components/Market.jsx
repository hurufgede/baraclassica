import { useNavigate } from 'react-router-dom';
import {
  Bell, Bookmark, Flame, MapPin, Plus, Search, Store,
} from 'lucide-react';
import { WA_SELL_URL } from './Layout';

export function VespaIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="5.5" cy="17" r="2.5" />
      <circle cx="18.5" cy="17" r="2.5" />
      <path d="M8 17h7.5" />
      <path d="M8 17c0-3.5.8-5.5 3-5.5h2l.5 2.5" />
      <path d="M15.5 17 17 7.5h2.2" />
      <path d="M17.6 7.5h2.4l-.6-2" />
    </svg>
  );
}

export function CatIcon({ size = 22 }) {
  return <VespaIcon size={size} />;
}

export function MarketSide({ cats = [], active = '', onCategory, price, setPrice, onApplyPrice }) {
  const nav = useNavigate();

  return (
    <aside className="mp-side">
      <div className="side-card">
        <h4>Jelajahi</h4>
        <div className="side-list">
          <button className={active === '' ? 'active' : ''} onClick={() => onCategory('')}>
            <span className="side-ic"><Store size={16} /></span> Semua barang
          </button>
          <button onClick={() => nav('/products?is_featured=1')}>
            <span className="side-ic"><Flame size={16} /></span> Best seller
          </button>
          <button onClick={() => nav('/products?is_new=1')}>
            <span className="side-ic"><Bell size={16} /></span> Baru datang
          </button>
          <button onClick={() => nav('/products?is_booked=1')}>
            <span className="side-ic"><Bookmark size={16} /></span> Terbooking
          </button>
        </div>
      </div>

      <div className="side-card">
        <h4>Kategori</h4>
        <div className="side-list">
          <button className={active === '' ? 'active' : ''} onClick={() => onCategory('')}>
            <span className="side-ic"><VespaIcon size={16} /></span> Semua
          </button>
          {cats.slice(0, 9).map((c) => (
            <button key={c.id} className={active === c.slug ? 'active' : ''} onClick={() => onCategory(c.slug)}>
              <span className="side-ic"><VespaIcon size={16} /></span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              <span className="c">{c.products_count ?? ''}</span>
            </button>
          ))}
        </div>
      </div>

      {setPrice && (
        <div className="side-card">
          <h4>Harga</h4>
          <div className="price-row">
            <input inputMode="numeric" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} aria-label="Harga min" />
            <input inputMode="numeric" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} aria-label="Harga max" />
          </div>
          <button className="btn btn--dark btn--block btn--sm" style={{ marginTop: 8 }} onClick={onApplyPrice}>
            <Search size={14} /> Terapkan
          </button>
        </div>
      )}

      <div className="side-card">
        <button className="btn btn--fb btn--block" onClick={() => window.open(WA_SELL_URL, '_blank')}>
          <Plus size={16} /> Jual barang
        </button>
        <p className="muted" style={{ margin: '8px 0 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          <MapPin size={13} /> Kediri | COD & Kirim tersedia
        </p>
      </div>
    </aside>
  );
}
