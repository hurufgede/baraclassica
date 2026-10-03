import { useToast } from '../store/shop';

export function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <button key={t.id} className={`toast toast--${t.type}`} onClick={() => dismiss(t.id)}>
          {t.message}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ h = 220 }) {
  return <div className="skeleton" style={{ height: h }} />;
}

export function Loading({ text = 'Memuat…' }) {
  return <div className="center"><span className="spin" /> {text}</div>;
}

export function Empty({ title, desc, action }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {desc && <p style={{ margin: '0 0 14px' }}>{desc}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message = 'Terjadi kesalahan.', onRetry }) {
  return (
    <div className="err">
      {message}
      {onRetry && <div style={{ marginTop: 10 }}><button className="btn btn--sm" onClick={onRetry}>Coba lagi</button></div>}
    </div>
  );
}

export function Modal({ onClose, children }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function Section({ title, link, items, render }) {
  if (!items) {
    return (
      <section>
        <div className="sec"><h2>{title}</h2></div>
        <div className="grid">{[1, 2, 3, 4].map((i) => <Skeleton key={i} />)}</div>
      </section>
    );
  }
  if (!items.length) return null;
  return (
    <section>
      <div className="sec"><h2>{title}</h2>{link}</div>
      <div className="grid">{items.slice(0, 4).map(render)}</div>
    </section>
  );
}
