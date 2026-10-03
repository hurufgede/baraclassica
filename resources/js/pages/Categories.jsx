import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../api/client';
import { CatIcon } from '../components/Market';
import { Empty, ErrorBox, Skeleton } from '../components/ui';

export default function Categories() {
  const [cats, setCats] = useState(null);
  const [error, setError] = useState(false);
  const nav = useNavigate();
  const load = () => {
    setError(false);
    api.get('/categories').then(({ data }) => setCats(data.data || [])).catch(() => setError(true));
  };
  useEffect(load, []);
  return (
    <>
      <h1>Jelajahi Vespa Klasik</h1>
      <p className="muted" style={{ marginTop: 0 }}>Pilih tipe favoritmu: Excel, Sprint, PX, Super, PTS, Strada, dan lainnya.</p>
      {error && <ErrorBox message="Gagal memuat kategori." onRetry={load} />}
      {!cats && !error && <div className="tiles">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} h={76} />)}</div>}
      {cats && cats.length === 0 && <Empty title="Belum ada kategori" />}
      {cats && cats.length > 0 && (
        <div className="tiles">
          {cats.map((c) => (
            <button key={c.id} className="tile" onClick={() => nav(`/products?category=${c.slug}`)}>
              <span className="side-ic" style={{ width: 44, height: 44 }}><CatIcon name={c.name} size={22} /></span>
              <span style={{ flex: 1 }}><b>{c.name}</b><span>{c.products_count ?? 0} listing</span></span>
              <ChevronRight size={18} color="#65676b" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
