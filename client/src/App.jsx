import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLang } from './LangContext';
import ImportTab from './components/ImportTab';
import ListTab from './components/ListTab';
import RandomTab from './components/RandomTab';
import './index.css';

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const { lang, t, toggleLang } = useLang();
  const [tab, setTab] = useState(0);
  const [films, setFilms] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [serverError, setServerError] = useState(false);

  const loadFilms = async () => {
    try {
      const res = await axios.get(`${API}/api/films`);
      setFilms(res.data);
      setServerError(false);
    } catch (err) {
      setServerError(true);
    }
  };

  useEffect(() => { loadFilms(); }, []);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const unwatched = films.filter(f => !f.watched).length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ background: 'linear-gradient(90deg, #7c6af7, #f76ab4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎬 {t.title}
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleLang}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '8px 12px', borderRadius: 'var(--radius)' }}>
            {lang === 'it' ? '🇬🇧' : '🇮🇹'}
          </button>
          <button onClick={() => setDarkMode(prev => !prev)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '8px 12px', fontSize: 18, borderRadius: 'var(--radius)' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Server error */}
      {serverError && (
        <div style={{ background: 'var(--danger)', color: 'white',
          borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          ⚠️ Server non raggiungibile.
          <span onClick={loadFilms} style={{ marginLeft: 8, cursor: 'pointer', textDecoration: 'underline' }}>
            Riprova
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4 }}>
        {t.tabs.map((tab_label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              flex: 1, background: tab === i ? 'var(--accent)' : 'transparent',
              color: tab === i ? 'white' : 'var(--muted)',
              borderRadius: 7, padding: '8px 0', fontWeight: tab === i ? 600 : 400
            }}>
            {tab_label}{i === 1 && unwatched > 0 ? ` (${unwatched})` : ''}
          </button>
        ))}
      </div>

      {tab === 0 && <ImportTab api={API} onImport={(f) => { setFilms(f); setTab(1); }} />}
      {tab === 1 && <ListTab api={API} films={films} onUpdate={setFilms} />}
      {tab === 2 && <RandomTab films={films} onUpdate={setFilms} />}

      {/* BuyMeACoffee */}
      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <a href="https://buymeacoffee.com/couchstudio" target="_blank" rel="noopener noreferrer">
          <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee" style={{ height: 45, borderRadius: 8 }} />
        </a>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>{t.coffee}</p>
      </div>

    </div>
  );
}