import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fmtIDR } from '../api/client';
import { useAuth, useCart, useToast } from '../store/shop';

const WA_ORDER = '6283814559988';

export default function Checkout() {
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    shipping_address: '', shipping_city: '', shipping_province: '', shipping_postal_code: '',
  });
  const [placing, setPlacing] = useState(false);
  const { cart, fetch, clearLocal } = useCart();
  const { user } = useAuth();
  const toast = useToast((s) => s.push);
  const nav = useNavigate();

  useEffect(() => {
    fetch();
    if (user) {
      setForm((f) => ({ ...f, customer_name: user.name, customer_email: user.email }));
      api.get('/addresses').then(({ data }) => {
        const d = (data.data || []).find((a) => a.is_default) || (data.data || [])[0];
        if (d) setForm((f) => ({ ...f, shipping_address: d.address_line, shipping_city: d.city, shipping_province: d.province, shipping_postal_code: d.postal_code, customer_phone: f.customer_phone || d.phone }));
      }).catch(() => {});
    }
  }, []);

  const shipCost = useMemo(() => (cart.subtotal >= 150000 ? 0 : 15000), [cart]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const waLines = (ref) => [
    'Halo bos, saya mau order:',
    `Ref: ${ref}`,
    `Nama: ${form.customer_name.trim()}`,
    `No. HP: ${form.customer_phone.trim()}`,
    `Email: ${form.customer_email.trim()}`,
    `Alamat: ${form.shipping_address.trim()}, ${form.shipping_city.trim()}, ${form.shipping_province.trim()} ${form.shipping_postal_code.trim()}`,
    'Produk:',
    ...cart.items.map((i) => `- ${i.product?.name || 'Produk'}${i.variant ? ` (${i.variant.name})` : ''} x${i.qty} — ${fmtIDR(i.price * i.qty)}`),
    `Subtotal: ${fmtIDR(cart.subtotal)}`,
    `Ongkir: ${shipCost === 0 ? 'Gratis' : fmtIDR(shipCost)}`,
    `Total: ${fmtIDR(cart.subtotal + shipCost)}`,
  ];

  const openWA = (ref) => {
    window.open(`https://wa.me/${WA_ORDER}?text=${encodeURIComponent(waLines(ref).join('\n'))}`, '_blank');
  };

  const clearGuestCart = async () => {
    try {
      await Promise.all((cart.items || []).map((i) => api.delete(`/cart/items/${i.id}`).catch(() => {})));
    } catch {}
    clearLocal(); fetch();
  };

  const place = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.customer_email.trim()) return toast('Lengkapi nama, email & no. HP', 'error');
    if (!form.customer_email.includes('@')) return toast('Email tidak valid', 'error');
    if (!form.shipping_address.trim() || !form.shipping_city.trim() || !form.shipping_province.trim() || !form.shipping_postal_code.trim()) return toast('Lengkapi semua alamat', 'error');
    if (!cart.items.length) return toast('Belum ada produk', 'error');
    if (!user) {
      const ref = `VSP-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      openWA(ref);
      await clearGuestCart();
      toast('Pesanan dikirim ke WA');
      nav('/');
      return;
    }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        ...form, shipping_method: 'regular', payment_method: 'cod', coupon_code: '',
      });
      const orderNo = data.data.order_number;
      openWA(orderNo);
      clearLocal(); fetch();
      toast(`Pesanan ${orderNo} dibuat`);
      nav('/');
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast(errs ? Object.values(errs).flat().join(', ') : err.response?.data?.message || 'Gagal membuat pesanan', 'error');
    } finally { setPlacing(false); }
  };

  return (
    <div>
      <h1>Checkout</h1>
      <form onSubmit={place}>
        <div className="cols">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form">
              <b>Data penerima</b>
              <label>Nama<input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="Nama penerima" /></label>
              <label>No. HP<input value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="08xx" inputMode="tel" /></label>
              <label>Email<input type="email" value={form.customer_email} onChange={(e) => set('customer_email', e.target.value)} placeholder="email@contoh.com" /></label>
            </div>
            <div className="form">
              <b>Alamat pengiriman</b>
              <label>Alamat<textarea value={form.shipping_address} onChange={(e) => set('shipping_address', e.target.value)} placeholder="Jalan, nomor rumah, patokan" /></label>
              <div className="form__2">
                <label>Kota<input value={form.shipping_city} onChange={(e) => set('shipping_city', e.target.value)} /></label>
                <label>Kode pos<input value={form.shipping_postal_code} onChange={(e) => set('shipping_postal_code', e.target.value)} /></label>
              </div>
              <label>Provinsi<input value={form.shipping_province} onChange={(e) => set('shipping_province', e.target.value)} /></label>
            </div>
          </div>
          <aside className="summary">
            <p><span>Subtotal ({cart.count})</span><span>{fmtIDR(cart.subtotal)}</span></p>
            <p><span>Ongkir</span><span>{shipCost === 0 ? 'Gratis' : fmtIDR(shipCost)}</span></p>
            <p className="total"><span>Total</span><span>{fmtIDR(cart.subtotal + shipCost)}</span></p>
            <button className="btn btn--primary btn--block" disabled={placing || !cart.items.length}>{placing ? 'Memproses…' : 'Buat pesanan'}</button>
          </aside>
        </div>
      </form>
    </div>
  );
}
