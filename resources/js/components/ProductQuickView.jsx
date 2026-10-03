import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShieldCheck, X, Zap } from 'lucide-react';
import api, { fmtIDR } from '../api/client';
import ImagePreview from './ImagePreview';
import { useCart, useQuickView, useToast } from '../store/shop';

export default function ProductQuickView() {
  const { key, fallback, close } = useQuickView();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(null);
  const [preview, setPreview] = useState(null);
  const { add } = useCart();
  const toast = useToast((s) => s.push);
  const nav = useNavigate();

  useEffect(() => {
    if (!key) { setData(null); return; }
    if (fallback && (fallback.name || fallback.product?.name)) {
      const p = fallback.product || fallback;
      if (!data || data.product?.id !== p.id) setData({ product: p, related: [] });
    }
    setLoading(true);
    setImg(0); setQty(1); setVariant(null); setPreview(null);
    api.get(`/products/${key}`)
      .then(({ data: r }) => setData(r.data))
      .catch(() => { if (!fallback) setData(null); })
      .finally(() => setLoading(false));
  }, [key]);

  const p = data?.product || fallback?.product || fallback || null;
  const images = p?.images?.length ? p.images : (p?.image ? [{ url: p.image }] : []);
  const mainImg = images[img]?.url || `https://loremflickr.com/800/800/vespa,classic,scooter?lock=${p?.id || 'x'}`;
  const previewUrl = preview !== null ? (images[preview]?.url || mainImg) : null;

  const closePreview = useCallback(() => {
    setPreview((cur) => {
      if (cur !== null) setImg(cur);
      return null;
    });
  }, []);
  const stepPreview = useCallback((dir) => {
    setPreview((cur) => {
      if (cur === null) return cur;
      const n = images.length || 1;
      const nx = ((cur + dir) % n + n) % n;
      setImg(nx);
      return nx;
    });
  }, [p?.id, images.length]);

  useEffect(() => {
    if (!key) return;
    const onKey = (e) => {
      if (preview !== null) {
        if (e.key === 'Escape') closePreview();
        if (e.key === 'ArrowRight') stepPreview(1);
        if (e.key === 'ArrowLeft') stepPreview(-1);
        return;
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [key, close, preview, closePreview, stepPreview]);

  if (!key) return null;

  const doAdd = async () => {
    if (!p?.in_stock && p?.stock <= 0) return;
    try {
      await add(p.id, qty, variant?.id);
      close();
      nav('/checkout');
    } catch { toast('Gagal memproses pesanan', 'error'); }
  };

  return (
    <div className="qv-bg" onClick={close}>
      <div className="qv" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="qv__x" onClick={close} aria-label="Tutup"><X size={18} /></button>
        {!p && !loading && (
          <div className="qv__empty">Produk tidak ditemukan.<button className="btn btn--sm" onClick={close}>Tutup</button></div>
        )}
        {p && (
          <>
            <div className="qv__hero" onClick={() => setPreview(img)} style={{ cursor: 'zoom-in' }} title="Klik untuk fullscreen">
              <img src={mainImg} alt={p.name} />
              <div className="qv__hero-shade" />
              <div className="qv__hero-top">
                <span className="qv__cat">{p.category?.name || 'Vespa Klasik'}</span>
                {p.is_booked && <span className="qv__habis">Terbooking</span>}
                {(!p.in_stock || p.stock <= 0) && <span className="qv__habis">Stok habis</span>}
              </div>
              <div className="qv__hero-bottom">
                <h2>{p.name}</h2>
              </div>
            </div>
            {images.length > 1 && (
              <div className="qv__thumbs">
                {images.slice(0, 5).map((im, i) => (
                  <button key={i} className={i === img ? 'active' : ''} onClick={() => { setImg(i); setPreview(i); }} title="Klik untuk fullscreen">
                    <img src={im.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <div className="qv__body">
              <div className="qv__price-row">
                <b className="qv__price">{fmtIDR(p.price)}</b>
              </div>

              {p.variants?.length > 0 && (
                <div className="qv__sec">
                  <p className="muted" style={{ margin: '0 0 6px' }}>Pilih varian</p>
                  <div className="opts">
                    {p.variants.map((v) => (
                      <button key={v.id} className={variant?.id === v.id ? 'active' : ''} onClick={() => setVariant(v)}>{v.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {(p.description || p.short_description) && (
                <p className="qv__desc">{p.description || p.short_description}</p>
              )}

              {(p.condition || p.surat || p.garansi) && (
                <div className="qv__spec">
                  {p.condition && <span><b>Kondisi</b> {p.condition}</span>}
                  {p.surat && <span><b>Surat</b> {p.surat}</span>}
                  {p.garansi && <span><b>Garansi</b> {p.garansi}</span>}
                </div>
              )}

              {p.specifications && Object.keys(p.specifications).length > 0 && (
                <div className="qv__spec">
                  {Object.entries(p.specifications).slice(0, 6).map(([k, v]) => (
                    <span key={k}><b>{k}</b> {String(v)}</span>
                  ))}
                </div>
              )}

              <div className="qv__actions">
                <div className="qv__qty">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Kurangi"><Minus size={15} /></button>
                  <b>{qty}</b>
                  <button onClick={() => setQty(Math.min(Math.max(1, Number(p.stock) || 1), qty + 1))} aria-label="Tambah"><Plus size={15} /></button>
                </div>
                <button className="btn qv__buy" disabled={!p.in_stock && p.stock <= 0} onClick={doAdd}>
                  <Zap size={16} /> Beli
                </button>
              </div>
              <p className="qv__safe"><ShieldCheck size={14} /> COD / Siap kirim ke seluruh Indonesia</p>
              {loading && <p className="muted" style={{ margin: '8px 0 0' }}>Memuat detail terbaru…</p>}
            </div>
          </>
        )}
        {preview !== null && previewUrl && (
          <ImagePreview
            url={previewUrl}
            alt={`Foto asli ${p?.name}`}
            index={preview}
            total={images.length}
            onClose={closePreview}
            onPrev={() => stepPreview(-1)}
            onNext={() => stepPreview(1)}
          />
        )}
      </div>
    </div>
  );
}
