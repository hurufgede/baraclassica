import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Package, Tags,
  Users, Wallet,
} from 'lucide-react';
import api, { fmtIDR } from '../api/client';
import { Empty, ErrorBox, Loading, Modal } from '../components/ui';
import { useAuth, useToast } from '../store/shop';

const TABS = [
  ['dashboard', 'Dashboard', <LayoutDashboard size={15} key="d" />],
  ['products', 'Produk', <Package size={15} key="p" />],
  ['categories', 'Kategori', <Tags size={15} key="k" />],
  ['customers', 'Pelanggan', <Users size={15} key="c" />],
];
const KONDISI = ['Bekas', 'Baru', 'Restorasi', 'Bahan'];
const SURAT = ['Lengkap', 'BPKB saja', 'STNK saja', 'Kosong'];

export default function Admin() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const nav = useNavigate();
  if (!user) return <Empty title="Masuk dulu" action={<button className="btn btn--primary" onClick={() => nav('/profile')}>Login</button>} />;
  if (!user.is_admin) return <Empty title="Khusus admin" desc="Akun ini bukan admin." />;
  return (
    <div className="admin">
      <div className="admin-head">
        <div>
          <h1>Dashboard Admin</h1>
          <p className="muted admin-head__sub">{user.name} • {user.email}</p>
        </div>
        <button className="btn btn--sm" onClick={async () => { await logout(); nav('/'); }}>
          <LogOut size={14} /> Keluar
        </button>
      </div>
      <div className="chips chips--admin">
        {TABS.map(([v, l, ic]) => (
          <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>
            {ic}{l}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <Dash />}
      {tab === 'products' && <Products />}
      {tab === 'categories' && <Cats />}
      {tab === 'customers' && <Customers />}
    </div>
  );
}

function Dash() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(({ data }) => setS(data.data)).catch(() => setS(false)); }, []);
  const max = useMemo(() => Math.max(1, ...(s?.salesChart || []).map((d) => Number(d.total) || 0)), [s]);
  const total14 = useMemo(() => (s?.salesChart || []).reduce((a, d) => a + (Number(d.total) || 0), 0), [s]);
  if (s === null) return <Loading text="Memuat…" />;
  if (s === false) return <Empty title="Gagal memuat" />;
  const cards = [
    { label: 'Pendapatan', value: fmtIDR(s.revenue), icon: <Wallet size={18} /> },
    { label: 'Pelanggan', value: s.customers, icon: <Users size={18} /> },
    { label: 'Produk', value: s.products, icon: <Package size={18} /> },
  ];
  return (
    <>
      <div className="admin-stats">
        {cards.map((c) => (
          <div key={c.label} className="admin-stat">
            <span className="admin-stat__ic">{c.icon}</span>
            <div><small>{c.label}</small><b>{c.value}</b></div>
          </div>
        ))}
      </div>
      {s.lowStock > 0 && (
        <div className="admin-alert">
          <span>{s.lowStock} produk stok menipis</span>
        </div>
      )}
      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Penjualan 14 hari</h2>
          <span className="muted">Total <b style={{ color: 'var(--gold)' }}>{fmtIDR(total14)}</b></span>
        </div>
        {total14 <= 0 ? (
          <p className="muted" style={{ margin: '4px 0 2px' }}>Belum ada penjualan 14 hari terakhir. Tandai produk yang laku lewat tombol Hapus → Laku dan Hapus.</p>
        ) : (
          <div className="bars bars--admin">
            {(s.salesChart || []).map((d) => (
              <div key={d.date} title={`${d.label}: ${fmtIDR(d.total)}`}>
                <i style={{ height: `${Math.max(2, ((Number(d.total) || 0) / max) * 100)}%` }} />
                <span>{String(d.label).split(' ')[0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const BLANK = {
  name: '', category_id: '', price: '', stock: '1',
  condition: 'Bekas', surat: 'Lengkap', garansi: '7 hari', description: '',
};

function Products() {
  const [items, setItems] = useState(null);
  const [cats, setCats] = useState([]);
  const [f, setF] = useState(BLANK);
  const [photos, setPhotos] = useState([]);
  const [preview, setPreview] = useState([]);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const toast = useToast((s) => s.push);
  const load = () => api.get('/products', { params: { per_page: 20 } }).then(({ data }) => setItems(data.data || [])).catch(() => setItems([]));
  useEffect(() => { load(); api.get('/categories').then(({ data }) => setCats(data.data || [])).catch(() => {}); }, []);

  const onPhotos = (e) => {
    const files = [...(e.target.files || [])].slice(0, 8);
    const ok = files.filter((fl) => fl.size <= 5 * 1024 * 1024);
    if (ok.length < files.length) toast('Sebagian foto >5MB dilewati', 'error');
    setPhotos(ok);
    setPreview(ok.map((fl) => URL.createObjectURL(fl)));
  };
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const openEdit = async (p) => {
    try {
      const { data } = await api.get(`/admin/admin-products/${p.id}`);
      const full = data.data || {};
      setEdit({ ...p, ...full, description: full.description ?? full.short_description ?? '' });
    } catch { setEdit(p); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', f.name);
      fd.append('category_id', f.category_id);
      fd.append('price', f.price);
      fd.append('stock', f.stock || 1);
      fd.append('condition', f.condition);
      fd.append('surat', f.surat);
      fd.append('garansi', f.garansi || '7 hari');
      fd.append('description', f.description);
      fd.append('status', 'active');
      photos.forEach((fl) => fd.append('images[]', fl));
      await api.post('/admin/admin-products', fd);
      toast('Produk dibuat');
      setF(BLANK); setPhotos([]); setPreview([]);
      load();
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast(errs ? Object.values(errs).flat().join(', ') : (err.response?.data?.message || 'Gagal menyimpan'), 'error');
    } finally { setSaving(false); }
  };

  if (items === null) return <Loading text="Memuat produk…" />;
  return (
    <>
      <form className="form form--admin" onSubmit={submit}>
        <div className="admin-panel__head"><b>Tambah produk</b><span className="muted">Foto bisa lebih dari 1</span></div>
        <label>Nama produk<input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="cth: Vespa Sprint 1978" /></label>
        <div className="form__2">
          <label>Kategori
            <select required value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Pilih kategori</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Harga (Rp)<input type="number" min="0" required value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="25000000" /></label>
        </div>
        <div className="form__2">
          <label>Kondisi
            <select value={f.condition} onChange={(e) => set('condition', e.target.value)}>
              {KONDISI.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label>Stok<input type="number" min="1" required value={f.stock} onChange={(e) => set('stock', e.target.value)} /></label>
        </div>
        <div className="form__2">
          <label>Surat
            <select value={f.surat} onChange={(e) => set('surat', e.target.value)}>
              {SURAT.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label>Garansi<input value={f.garansi} onChange={(e) => set('garansi', e.target.value)} placeholder="7 hari" /></label>
        </div>
        <label>Deskripsi / detail<textarea rows={4} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Tahun, pajak, kelistrikan, minus, dsb." /></label>
        <label>Foto produk
          <input type="file" accept="image/*" multiple onChange={onPhotos} />
        </label>
        {preview.length > 0 && (
          <div className="photo-preview">
            {preview.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />)}
          </div>
        )}
        <button className="btn btn--primary btn--block" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan produk'}</button>
      </form>

      <div className="table-box">
        <table className="t">
          <thead><tr><th>Produk</th><th>Harga</th><th>Stok</th><th></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {p.image && <img src={p.image} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10 }} loading="lazy" />}
                    <span><b>{p.name}</b><br /><span className="muted">{p.category?.name}{p.condition ? ` • ${p.condition}` : ''}{p.is_featured ? ' • ★ Best' : ''}{p.is_new ? ' • Baru' : ''}{p.is_booked ? ' • Booking' : ''}</span></span>
                  </span>
                </td>
                <td>{fmtIDR(p.price)}</td>
                <td>{p.stock}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn--sm" onClick={() => openEdit(p)}>Ubah</button>{' '}
                  <button className="btn btn--sm" onClick={() => setDel(p)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal onClose={() => setEdit(null)}>
          <h3>Ubah produk</h3>
          <form className="form" onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
              await api.put(`/admin/admin-products/${edit.id}`, {
                name: fd.get('name'), price: fd.get('price'), stock: fd.get('stock'),
                description: fd.get('description'), condition: fd.get('condition'),
                surat: fd.get('surat'), garansi: fd.get('garansi'),
                is_featured: fd.get('is_featured') === '1',
                is_new: fd.get('is_new') === '1',
                is_booked: fd.get('is_booked') === '1',
              });
              toast('Tersimpan'); setEdit(null); load();
            } catch { toast('Gagal', 'error'); }
          }}>
            <label>Nama<input name="name" defaultValue={edit.name} required /></label>
            <div className="form__2">
              <label>Harga<input name="price" type="number" defaultValue={edit.price} required /></label>
              <label>Stok<input name="stock" type="number" defaultValue={edit.stock} required /></label>
            </div>
            <div className="form__2">
              <label>Kondisi
                <select name="condition" defaultValue={edit.condition || 'Bekas'}>
                  {KONDISI.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label>Surat
                <select name="surat" defaultValue={edit.surat || 'Lengkap'}>
                  {SURAT.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
            </div>
            <label>Garansi<input name="garansi" defaultValue={edit.garansi || '7 hari'} /></label>
            <label>Deskripsi<textarea name="description" rows={3} defaultValue={edit.description || ''} /></label>
            <label>Kategori jelajah</label>
            <div className="form__2">
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="is_featured" value="1" defaultChecked={!!edit.is_featured} style={{ width: 18, height: 18 }} /> Best Seller
              </label>
              <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="is_new" value="1" defaultChecked={!!edit.is_new} style={{ width: 18, height: 18 }} /> Baru Datang
              </label>
            </div>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="is_booked" value="1" defaultChecked={!!edit.is_booked} style={{ width: 18, height: 18 }} /> Terbooking
            </label>
            <button className="btn btn--primary btn--block">Simpan</button>
          </form>
        </Modal>
      )}
      {del && (
        <DeleteProduct
          p={del}
          onClose={() => setDel(null)}
          onDone={() => { setDel(null); load(); }}
        />
      )}
    </>
  );
}

function DeleteProduct({ p, onClose, onDone }) {
  const maxQty = Math.max(1, Number(p.stock) || 1);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(String(p.price ?? ''));
  const [busy, setBusy] = useState(null);
  const toast = useToast((s) => s.push);
  const total = (Number(price) || 0) * (Number(qty) || 0);

  const doDelete = async () => {
    setBusy('delete');
    try {
      await api.delete(`/admin/admin-products/${p.id}`);
      toast('Produk dihapus');
      onDone();
    } catch { toast('Gagal menghapus', 'error'); }
    finally { setBusy(null); }
  };

  const doSold = async () => {
    setBusy('sold');
    try {
      const { data } = await api.post(`/admin/admin-products/${p.id}/mark-sold`, {
        qty: Number(qty) || 1,
        sold_price: Number(price) || 0,
      });
      toast(data?.message || `Tercatat laku ${fmtIDR(total)}`);
      onDone();
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast(errs ? Object.values(errs).flat().join(', ') : (err.response?.data?.message || 'Gagal mencatat'), 'error');
    } finally { setBusy(null); }
  };

  return (
    <Modal onClose={onClose}>
      <h3 style={{ margin: '0 0 4px' }}>Hapus produk?</h3>
      <p className="muted" style={{ margin: '0 0 10px' }}>
        <b style={{ color: 'var(--text)' }}>{p.name}</b> • {fmtIDR(p.price)} • stok {p.stock}<br />
        Apakah produk ini <b>laku</b> atau <b>hapus saja</b>?
      </p>
      <div className="form" style={{ boxShadow: 'none', padding: 0, background: 'none' }}>
        <div className="form__2">
          <label>Jumlah laku<input type="number" min={1} max={maxQty} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))} /></label>
          <label>Harga laku (Rp)<input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        </div>
        <p className="muted" style={{ margin: 0 }}>Masuk pendapatan: <b style={{ color: 'var(--gold)' }}>{fmtIDR(total)}</b></p>
        <button className="btn btn--primary btn--block" disabled={busy !== null} onClick={doSold}>
          {busy === 'sold' ? 'Menyimpan…' : 'Laku dan Hapus'}
        </button>
        <button className="btn btn--block" disabled={busy !== null} onClick={doDelete}>
          {busy === 'delete' ? 'Menghapus…' : 'Hapus saja'}
        </button>
        <button className="btn btn--block" disabled={busy !== null} onClick={onClose}>Batal</button>
      </div>
    </Modal>
  );
}

const catImg = (c) => {
  const p = c?.image;
  if (!p || typeof p !== 'string') return null;
  return p.startsWith('http') ? p : `/storage/${p}`;
};

function Cats() {
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const [f, setF] = useState({ name: '', description: '', sort_order: '0', is_active: true });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(null);
  const toast = useToast((s) => s.push);
  const load = () => {
    setFailed(false);
    api.get('/admin/admin-categories')
      .then(({ data }) => setItems(Array.isArray(data?.data) ? data.data : []))
      .catch(() => { setItems([]); setFailed(true); });
  };
  useEffect(load, []);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const onPhoto = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      toast('Foto maksimal 5MB', 'error');
      e.target.value = '';
      return;
    }
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', f.name);
      fd.append('description', f.description);
      fd.append('sort_order', f.sort_order || 0);
      fd.append('is_active', f.is_active ? 1 : 0);
      if (photo) fd.append('image', photo);
      await api.post('/admin/admin-categories', fd);
      toast('Kategori dibuat');
      setF({ name: '', description: '', sort_order: '0', is_active: true });
      setPhoto(null); setPreview(null);
      load();
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast(errs ? Object.values(errs).flat().join(', ') : (err.response?.data?.message || 'Gagal menyimpan'), 'error');
    } finally { setSaving(false); }
  };

  if (items === null) return <Loading text="Memuat…" />;
  const rows = Array.isArray(items) ? items : [];
  return (
    <>
      {failed && <ErrorBox message="Gagal memuat kategori." onRetry={load} />}
      <form className="form form--admin" onSubmit={submit}>
        <div className="admin-panel__head"><b>Tambah kategori</b><span className="muted">Foto opsional</span></div>
        <label>Nama kategori<input required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="cth: Vespa Sprint" /></label>
        <label>Deskripsi<textarea rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Keterangan singkat kategori" /></label>
        <div className="form__2">
          <label>Urutan<input type="number" min="0" value={f.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></label>
          <label>Status
            <select value={f.is_active ? '1' : '0'} onChange={(e) => set('is_active', e.target.value === '1')}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </label>
        </div>
        <label>Foto kategori
          <input type="file" accept="image/*" onChange={onPhoto} />
        </label>
        {preview && (
          <div className="photo-preview">
            <img src={preview} alt="" loading="lazy" />
          </div>
        )}
        <button className="btn btn--primary btn--block" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan kategori'}</button>
      </form>
      {rows.length === 0 && <Empty title="Belum ada kategori" desc="Tambah kategori pertama lewat form di atas." />}
      <div className="table-box">
        <table className="t">
          <thead><tr><th>Kategori</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {catImg(c) && <img src={catImg(c)} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10 }} loading="lazy" />}
                    <span><b>{String(c.name ?? '')}</b><br /><span className="muted">{String(c.slug ?? '')}{c.description ? ` • ${String(c.description).slice(0, 40)}` : ''}</span></span>
                  </span>
                </td>
                <td><span className={`pill ${c.is_active ? 'pill--delivered' : ''}`}>{c.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn--sm" onClick={() => setEdit(c)}>Ubah</button>{' '}
                  <button className="btn btn--sm" onClick={async () => { if (confirm('Hapus?')) { try { await api.delete(`/admin/admin-categories/${c.id}`); load(); } catch { toast('Dipakai produk', 'error'); } } }}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal onClose={() => setEdit(null)}>
          <h3>Ubah kategori</h3>
          <form className="form" onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
              await api.put(`/admin/admin-categories/${edit.id}`, {
                name: fd.get('name'), description: fd.get('description'),
                sort_order: Number(fd.get('sort_order') || 0), is_active: fd.get('is_active') === '1',
              });
              toast('Tersimpan'); setEdit(null); load();
            } catch { toast('Gagal', 'error'); }
          }}>
            <label>Nama<input name="name" defaultValue={edit.name} required /></label>
            <label>Deskripsi<textarea name="description" rows={3} defaultValue={edit.description || ''} /></label>
            <div className="form__2">
              <label>Urutan<input name="sort_order" type="number" min="0" defaultValue={edit.sort_order ?? 0} /></label>
              <label>Status
                <select name="is_active" defaultValue={edit.is_active ? '1' : '0'}>
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </label>
            </div>
            <button className="btn btn--primary btn--block">Simpan</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Customers() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/admin/customers').then(({ data }) => setRows(data.data || [])).catch(() => setRows([])); }, []);
  if (rows === null) return <Loading text="Memuat…" />;
  return (
    <div className="table-box">
      <table className="t">
        <thead><tr><th>Nama</th><th>Email</th><th>Pesanan</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id}><td><b>{u.name}</b></td><td className="muted">{u.email}</td><td>{u.orders_count ?? '-'}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
