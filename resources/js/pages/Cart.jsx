import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { fmtIDR } from '../api/client';
import { Empty } from '../components/ui';
import { useCart, useToast } from '../store/shop';

export default function Cart() {
  const { cart, fetch, updateQty, remove } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const nav = useNavigate();
  const toast = useToast((s) => s.push);

  useEffect(() => { fetch(); }, []);

  const apply = async () => {
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, subtotal: cart.subtotal });
      setDiscount(data.data.discount);
      toast(`Diskon ${fmtIDR(data.data.discount)}`);
    } catch (err) {
      setDiscount(0);
      toast(err.response?.data?.message || 'Kupon tidak valid', 'error');
    }
  };

  if (!cart.items.length) {
    return <Empty title="Keranjang kosong" desc="Cari barang favoritmu." action={<button className="btn btn--primary" onClick={() => nav('/products')}>Mulai belanja</button>} />;
  }

  const shipping = cart.subtotal >= 150000 ? 0 : 15000;
  const total = cart.subtotal - discount + shipping;

  return (
    <div>
      <h1>Keranjang ({cart.count})</h1>
      <div className="cols">
        <div>
          {cart.items.map((i) => (
            <div key={i.id} className="line">
              <img src={i.product?.image} alt={i.product?.name} loading="lazy" />
              <div>
                <Link to={`/products/${i.product?.slug}`} style={{ color: 'inherit' }}><b>{i.product?.name}</b></Link>
                {i.variant && <p className="muted" style={{ margin: '2px 0' }}>{i.variant.name}</p>}
                <p style={{ margin: '4px 0' }}>{fmtIDR(i.price)}</p>
                <div className="qty" style={{ margin: 0 }}>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => updateQty(i.id, Math.max(1, i.qty - 1))}>−</button>
                  <b>{i.qty}</b>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => updateQty(i.id, Math.min(Math.max(1, Number(i.product?.stock) || 1), i.qty + 1))}>+</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <b>{fmtIDR(i.price * i.qty)}</b>
                <button className="btn btn--sm" onClick={() => remove(i.id)}>Hapus</button>
              </div>
            </div>
          ))}
          <div className="form" style={{ flexDirection: 'row', display: 'flex' }}>
            <input style={{ flex: 1 }} placeholder="Kode kupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} aria-label="Kupon" />
            <button className="btn" onClick={apply}>Pakai</button>
          </div>
        </div>
        <aside className="summary">
          <p><span>Subtotal</span><span>{fmtIDR(cart.subtotal)}</span></p>
          {discount > 0 && <p><span>Diskon</span><span>-{fmtIDR(discount)}</span></p>}
          <p><span>Ongkir</span><span>{shipping === 0 ? 'Gratis' : fmtIDR(shipping)}</span></p>
          <p className="total"><span>Total</span><span>{fmtIDR(total)}</span></p>
          <button className="btn btn--primary btn--block" onClick={() => nav('/checkout', { state: { coupon } })}>Checkout</button>
        </aside>
      </div>
    </div>
  );
}
