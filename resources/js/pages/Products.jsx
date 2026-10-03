import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import { MarketSide } from '../components/Market';
import { Empty, Loading, Skeleton } from '../components/ui';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cats, setCats] = useState([]);
  const [price, setPrice] = useState({ min: '', max: '' });
  const f = Object.fromEntries(params.entries());
  const key = params.toString();
  const sentinel = useRef(null);
  const state = useRef({ page: 1, hasMore: true, loading: false });
  state.current.page = page;
  state.current.hasMore = hasMore;

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCats(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancel = false;
    setItems(null);
    setPage(1);
    setHasMore(true);
    state.current.loading = true;
    api.get('/products', { params: { ...f, page: 1 } })
      .then(({ data }) => {
        if (cancel) return;
        setItems(data.data || []);
        setHasMore((data.meta?.current_page ?? 1) < (data.meta?.last_page ?? 1));
      })
      .catch(() => { if (!cancel) setItems([]); })
      .finally(() => { state.current.loading = false; });
    return () => { cancel = true; };
  }, [key]);

  const loadMore = () => {
    const s = state.current;
    if (s.loading || !s.hasMore) return;
    s.loading = true;
    setLoadingMore(true);
    const next = s.page + 1;
    api.get('/products', { params: { ...f, page: next } })
      .then(({ data }) => {
        setItems((prev) => [...(prev || []), ...(data.data || [])]);
        setPage(next);
        setHasMore((data.meta?.current_page ?? next) < (data.meta?.last_page ?? next));
      })
      .catch(() => {})
      .finally(() => { state.current.loading = false; setLoadingMore(false); });
  };

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => { if (es[0].isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [key, items === null]);

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (!v) next.delete(k); else next.set(k, v);
    next.delete('page');
    setParams(next);
  };

  return (
    <div className="mp">
      <MarketSide
        cats={cats} active={f.category || ''}
        onCategory={(slug) => set('category', slug)}
        price={price} setPrice={setPrice}
        onApplyPrice={() => {
          const next = new URLSearchParams(params);
          if (price.min) next.set('min_price', price.min); else next.delete('min_price');
          if (price.max) next.set('max_price', price.max); else next.delete('max_price');
          next.delete('page');
          setParams(next);
        }}
      />
      <div style={{ minWidth: 0 }}>
        {items === null ? (
          <div className="grid grid--mp">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} />)}</div>
        ) : items.length === 0 ? (
          <Empty title="Tidak ada listing" desc="Coba kategori atau rentang harga lain." action={<button className="btn" onClick={() => { setPrice({ min: '', max: '' }); setParams({}); }}>Reset filter</button>} />
        ) : (
          <>
            <div className="grid grid--mp">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            <div ref={sentinel} style={{ height: 1 }} />
            {loadingMore && <Loading text="Memuat lagi…" />}
          </>
        )}
      </div>
    </div>
  );
}
