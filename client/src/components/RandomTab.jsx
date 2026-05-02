import { useState } from 'react';

export default function RandomTab({ films, onUpdate }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [pick, setPick] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [ignored, setIgnored] = useState([]);

  const pool = films.filter(f => {
    if (f.watched) return false;
    if (ignored.includes(f.id)) return false;
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    return true;
  });

  const spin = () => {
    if (!pool.length) return;
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      if (++count > 20) {
        clearInterval(interval);
        setRolling(false);
        setPick(pool[Math.floor(Math.random() * pool.length)]);
      }
    }, 80);
  };

  const ignore = () => {
    if (!pick) return;
    setIgnored(prev => [...prev, pick.id]);
    setPick(null);
  };

  const reset = () => {
    setIgnored([]);
    setPick(null);
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>

      {/* Filtro tipo — QUI, prima di tutto il resto */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPick(null); }}
          style={{ width: '100%' }}>
          <option value="all">🎬📺 Film e Serie</option>
          <option value="film">🎬 Solo Film</option>
          <option value="serie">📺 Solo Serie</option>
        </select>
      </div>

      {ignored.length > 0 && (
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--muted)' }}>
          {ignored.length} titoli ignorati stasera —{' '}
          <span onClick={reset} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            reimposta
          </span>
        </div>
      )}

      <div style={{
        minHeight: 160, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface)', borderRadius: 16,
        padding: 32, marginBottom: 24,
        border: pick && !rolling ? '1px solid var(--accent)' : '1px solid var(--border)',
        transition: 'border-color 0.3s'
      }}>
        {pick ? (
          <>
            <div style={{
              fontSize: 28, fontWeight: 700,
              opacity: rolling ? 0.3 : 1, transition: 'opacity 0.08s',
              background: rolling ? 'none' : 'linear-gradient(90deg, #7c6af7, #f76ab4)',
              WebkitBackgroundClip: rolling ? 'unset' : 'text',
              WebkitTextFillColor: rolling ? 'var(--text)' : 'transparent'
            }}>
              {pick.type === 'serie' ? '📺' : '🎬'} {pick.title}
            </div>
            {pick.genre && (
              <div style={{ color: 'var(--muted)', marginTop: 8, fontSize: 13 }}>{pick.genre}</div>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--muted)' }}>
            {pool.length === 0 && ignored.length > 0
              ? '😅 Hai ignorato tutto!'
              : 'Premi il pulsante per scegliere!'}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={spin} disabled={!pool.length || rolling}
          style={{ fontSize: 16, padding: '14px 36px',
            background: 'linear-gradient(90deg, #7c6af7, #f76ab4)' }}>
          🎲 Scegli per me
        </button>

        {pick && !rolling && (
          <button onClick={ignore} className="ghost"
            style={{ fontSize: 16, padding: '14px 20px' }}>
            👎 Ignora stasera
          </button>
        )}
      </div>

      {!pool.length && ignored.length === 0 && (
        <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: 13 }}>
          Nessun titolo da vedere nella lista.
        </p>
      )}

      {pool.length === 0 && ignored.length > 0 && (
        <button onClick={reset} className="ghost" style={{ marginTop: 16 }}>
          🔄 Reimposta tutto
        </button>
      )}

      {pick && !rolling && pool.length > 1 && (
        <p style={{ color: 'var(--muted)', marginTop: 16, fontSize: 13 }}>
          Non ti convince?{' '}
          <span onClick={spin} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            Riprova
          </span>
          {' · '}
          <span onClick={ignore} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
            Ignora stasera
          </span>
        </p>
      )}

    </div>
  );
}