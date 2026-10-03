import { useNavigate } from 'react-router-dom';

export default function About() {
  const nav = useNavigate();
  return (
    <>
      <h1 style={{ fontSize: 'clamp(30px,4.5vw,44px)', maxWidth: 640 }}>Belanja sederhana, kualitas premium.</h1>
      <p className="muted" style={{ fontSize: 16, maxWidth: 600 }}>Apanih mengkurasi elektronik, fashion, dan kebutuhan harian terbaik. Original, bergaransi resmi, dikirim cepat.</p>
      <button className="btn btn--primary" onClick={() => nav('/products')}>Mulai belanja</button>
      <div className="values">
        <div><h3>Cepat</h3><p>Gratis ongkir min. Rp150rb ke seluruh Indonesia.</p></div>
        <div><h3>Original</h3><p>Garansi resmi dan jaminan keaslian.</p></div>
        <div><h3>Mudah</h3><p>Retur 7 hari tanpa ribet.</p></div>
      </div>
    </>
  );
}
