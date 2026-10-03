import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import api from '../api/client';
import { useAuth, useToast } from '../store/shop';

export default function Profile() {
  const { user, setAuth, logout } = useAuth();
  const toast = useToast((s) => s.push);
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user?.is_admin) {
    return (
      <div className="auth auth--profile">
        <div className="profile-card">
          <div className="auth__avatar">
            <User size={28} />
          </div>
          <b className="profile-card__name">{user.name}</b>
          <p className="muted profile-card__email">{user.email}</p>
          <span className="pill pill--delivered">Admin</span>
          <button
            className="btn btn--block"
            onClick={async () => { await logout(); nav('/'); }}
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth auth--profile">
      <form
        className="auth__form"
        onSubmit={async (e) => {
          e.preventDefault(); setLoading(true);
          try {
            const { data } = await api.post('/login', form);
            const u = data.data.user;
            if (!u.is_admin) {
              toast('Khusus admin', 'error');
              return;
            }
            setAuth(u, data.data.token);
            toast('Selamat datang Admin!');
            nav('/admin');
          } catch (err) { toast(err.response?.data?.message || 'Login gagal', 'error'); }
          finally { setLoading(false); }
        }}
      >
        <div className="auth__avatar">
          <User size={28} />
        </div>
        <h1 className="auth__title">Profil Admin</h1>
        <p className="muted auth__sub">Masuk khusus admin</p>
        <label className="auth__field"><span>Email</span><input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="auth__field"><span>Password</span><input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn btn--primary btn--block auth__btn" disabled={loading}>{loading ? 'Memproses…' : 'Masuk'}</button>
      </form>
    </div>
  );
}
