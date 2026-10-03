import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import { MarketSide } from '../components/Market';
import { Empty, ErrorBox, Skeleton } from '../components/ui';

export default function Home() {
  const [data, setData] = useState(null);
  const [cats, setCats] = useState([]);
  const [failed, setFailed] = useState(false);
  const nav = useNavigate();

  const load = () => {
    setFailed(false);
    api.get('/home').then(({ data }) => setData(data.data)).catch(() => setFailed(true));
    api.get('/categories').then(({ data }) => setCats(data.data || [])).catch(() => {});
  };
  useEffect(load, []);

  const seen = new Set();
  const picks = [...(data?.featured || []), ...(data?.new_arrivals || []), ...(data?.best_sellers || []), ...(data?.flash_sale || [])]
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .slice(0, 16);

  return (
    <>
      <div className="mp">
        <MarketSide cats={cats} active="" onCategory={(slug) => nav(slug ? `/products?category=${slug}` : '/products')} />
        <div style={{ minWidth: 0 }}>
          {failed && <ErrorBox message="Gagal memuat unit Vespa." onRetry={load} />}
          {!data ? (
            <div className="grid">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} />)}</div>
          ) : picks.length === 0 ? (
            <Empty title="Belum ada listing" desc="Coba lagi nanti." />
          ) : (
            <div className="grid">{picks.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          )}
        </div>
      </div>
    </>
  );
}
