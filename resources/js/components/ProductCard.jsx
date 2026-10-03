import { fmtIDR } from '../api/client';
import { useQuickView } from '../store/shop';

export default function ProductCard({ p }) {
  const open = useQuickView((s) => s.open);
  const go = () => open(p.slug || p.id, p);

  return (
    <article className="card">
      <div className="card__img" onClick={go}>
        <img src={p.image || `https://loremflickr.com/600/600/vespa,classic,scooter?lock=${p.id}`} alt={p.name} loading="lazy" />
        {p.is_booked && <span className="card__booked">Terbooking</span>}
      </div>
      <div className="card__body" onClick={go} style={{ cursor: 'pointer' }}>
        <p className="card__price2">
          {fmtIDR(p.price)}
        </p>
        <h3 className="card__name">{p.name}</h3>
        {!p.in_stock && <p className="card__loc" style={{ color: '#d70015', fontWeight: 700 }}>Habis</p>}
      </div>
    </article>
  );
}
