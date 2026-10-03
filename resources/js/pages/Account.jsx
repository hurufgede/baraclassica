import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { fmtIDR } from '../api/client';
import ProductCard from '../components/ProductCard';
import { Empty, Loading, Modal } from '../components/ui';
import { useAuth, useToast } from '../store/shop';

export default function Account() {
  const { user, logout, updateProfile } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'profile';
  const nav = useNavigate();
  const setTab = (t) => setParams(t === 'profile' ? {} : { tab: t });

  if (!user) return <Empty title="Masuk dulu" action={<button className="btn btn--primary" onClick={() => nav('/profile')}>Masuk</button>} />;

  return (
    <div>
      <div className="profile">
        <div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>{user.name}</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email}</p>
        </div>
      </div>
      <div className="tabs">
        {[['profile', 'Profil'], ['orders', 'Pesanan'], ['addresses', 'Alamat']].map(([v, l]) => (
          <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>
      {tab === 'profile' && <Profile user={user} updateProfile={updateProfile} logout={logout} nav={nav} />}
      {tab === 'orders' && <Orders />}
      {tab === 'addresses' && <Addresses />}
    </div>
  );
}

function Profile({ user, updateProfile, logout, nav }) {
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '' });
  const toast = useToast((s) => s.push);
  return (
    <>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        try { await updateProfile(form); }
        catch (err) { toast('Gagal menyimpan', 'error'); }
      }}>
        <label>Nama<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Email<input value={user.email} disabled /></label>
        <label>No. HP<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xx" /></label>
        <button className="btn btn--primary">Simpan</button>
      </form>
      <div style={{ marginTop: 10 }}><button className="btn btn--block" onClick={async () => { await logout(); nav('/'); }}>Keluar</button></div>
    </>
  );
}

function Orders() {
  const [orders, setOrders] = useState(null);
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(data.data || [])).catch(() => setOrders([]));
  }, []);
  if (orders === null) return <Loading text="Memuat pesanan…" />;
  return (
    <>
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <h3 style={{ margin: '0 0 4px' }}>{detail.order_number}</h3>
          <p><span className={`pill pill--${detail.status}`}>{detail.status}</span></p>
          <p className="muted">{detail.shipping_address}, {detail.shipping_city}</p>
          {detail.items?.map((i) => (
            <div key={i.id} className="order" style={{ cursor: 'default' }}>
              <span style={{ flex: 1 }}>{i.qty}× {i.product_name}</span><b>{fmtIDR(i.subtotal)}</b>
            </div>
          ))}
          <h3>Total {fmtIDR(detail.grand_total)}</h3>
          <button className="btn btn--primary btn--block" onClick={() => setDetail(null)}>Tutup</button>
        </Modal>
      )}
      {orders.length === 0 ? <Empty title="Belum ada pesanan" /> : (
        <div className="orders">
          {orders.map((o) => (
            <button key={o.id} className="order" onClick={() => api.get(`/orders/${o.id}`).then(({ data }) => setDetail(data.data))}>
              <b style={{ flex: 1 }}>{o.order_number}</b>
              <span className={`pill pill--${o.status}`}>{o.status}</span>
              <span>{fmtIDR(o.grand_total)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const BLANK = { label: 'Rumah', recipient_name: '', phone: '', address_line: '', city: '', province: '', postal_code: '', is_default: false };

function Addresses() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const toast = useToast((s) => s.push);
  const load = () => api.get('/addresses').then(({ data }) => setItems(data.data || [])).catch(() => setItems([]));
  useEffect(load, []);
  if (items === null) return <Loading text="Memuat alamat…" />;
  return (
    <>
      <div className="addr">
        {items.map((a) => (
          <div key={a.id} className="addr-card">
            <b>{a.label} {a.is_default && <span className="pill pill--delivered">Utama</span>}</b>
            <p className="muted" style={{ margin: '4px 0' }}>{a.recipient_name} • {a.phone}<br />{a.address_line}, {a.city}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--sm" onClick={() => { setEditing(a.id); setForm({ ...BLANK, ...a }); }}>Ubah</button>
              <button className="btn btn--sm" onClick={async () => { if (confirm('Hapus?')) { await api.delete(`/addresses/${a.id}`); load(); } }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
      {!form && <div style={{ marginTop: 10 }}><button className="btn btn--block" onClick={() => { setEditing(null); setForm(BLANK); }}>+ Tambah alamat</button></div>}
      {form && (
        <form className="form" style={{ marginTop: 10 }} onSubmit={async (e) => {
          e.preventDefault();
          try {
            if (editing) await api.put(`/addresses/${editing}`, form);
            else await api.post('/addresses', form);
            toast('Alamat tersimpan'); setForm(null); setEditing(null); load();
          } catch { toast('Gagal menyimpan', 'error'); }
        }}>
          <div className="form__2">
            <label>Label<input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
            <label>Penerima<input required value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></label>
          </div>
          <label>No. HP<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Alamat<textarea required value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} /></label>
          <div className="form__2">
            <label>Kota<input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
            <label>Kode pos<input required value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></label>
          </div>
          <label>Provinsi<input required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => { setForm(null); setEditing(null); }}>Batal</button>
            <button className="btn btn--primary" style={{ flex: 1 }}>Simpan</button>
          </div>
        </form>
      )}
    </>
  );
}

export function WishlistPage() {
  const [items, setItems] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (user) api.get('/wishlist').then(({ data }) => setItems(data.data || [])).catch(() => setItems([]));
  }, []);
  if (!user) return <Empty title="Masuk untuk melihat terbooking" action={<button className="btn btn--primary" onClick={() => nav('/profile')}>Masuk</button>} />;
  if (items === null) return <Loading text="Memuat terbooking…" />;
  if (!items.length) return <Empty title="Belum ada yang terbooking" action={<button className="btn btn--primary" onClick={() => nav('/products')}>Cari produk</button>} />;
  return (<><h1>Terbooking ({items.length})</h1><div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div></>);
}
