import { useState } from 'react';
import { signIn } from '../lib/auth';

export default function Login({ onLogin, onBack }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Introduce email y contraseña.'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await signIn(email, password);
      onLogin(user);
    } catch (err) {
      setError('Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="top-bar">
        <button className="icon-btn" onClick={onBack}>←</button>
        <div className="top-bar-title">Iniciar sesión</div>
      </header>
      <main className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - var(--bar-h))' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, padding: '0 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🍇</div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--primary)' }}>Control de Calidad</div>
            <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: '.25rem' }}>Acceso de administrador</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                style={{ width: '100%', padding: '.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: '.75rem', background: 'var(--surface)', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ width: '100%', padding: '.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: '.75rem', background: 'var(--surface)', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            {error && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '.65rem 1rem', borderRadius: '.6rem', fontSize: '.88rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cta-btn"
              style={{ marginTop: '.5rem', opacity: loading ? .6 : 1 }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
