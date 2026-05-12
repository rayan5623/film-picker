import { useState } from 'react';
import { useLang } from '../LangContext';

export default function RandomTab({ films }) {
  const { t } = useLang();
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

      {/* Filtro tipo */}
      <div style={{ marginBottom: 16 }}>
        <select value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPick(null); }}
          style={{ width: '100%' }}>
          <option value="all">{t.random.allTypes}</option>
          <option value="film">{t.random.onlyFilms}</option>
          <option value="serie">{t.random.onlySeries}</option>
        </select>
      </div>

      {ignored.length > 0 && (
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--muted)' }}>
          {ignored.length} {t.random.ignored}{' '}
          <span onClick={reset} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            {t.random.reset}
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
            {pool.length === 0 && ignored.length > 0 ? t.random.ignoredAll : t.random.press}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={spin} disabled={!pool.length || rolling}
          style={{ fontSize: 16, padding: '14px 36px',
            background: 'linear-gradient(90deg, #7c6af7, #f76ab4)' }}>
          {t.random.spin}
        </button>

        {pick && !rolling && (
          <button onClick={ignore} className="ghost"
            style={{ fontSize: 16, padding: '14px 20px' }}>
            {t.random.ignore}
          </button>
        )}
      </div>

      {!pool.length && ignored.length === 0 && (
        <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: 13 }}>
          {t.random.empty}
        </p>
      )}

      {pool.length === 0 && ignored.length > 0 && (
        <button onClick={reset} className="ghost" style={{ marginTop: 16 }}>
          {t.random.resetAll}
        </button>
      )}

      {pick && !rolling && pool.length > 1 && (
        <p style={{ color: 'var(--muted)', marginTop: 16, fontSize: 13 }}>
          {t.random.notConvinced}{' '}
          <span onClick={spin} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            {t.random.retry}
          </span>
          {' · '}
          <span onClick={ignore} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
            {t.random.ignore}
          </span>
        </p>
      )}

    </div>
  );
}