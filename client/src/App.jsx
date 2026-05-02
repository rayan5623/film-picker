import { useState, useEffect } from 'react';
import axios from 'axios';
import ImportTab from './components/ImportTab';
import ListTab from './components/ListTab';
import RandomTab from './components/RandomTab';
import './index.css';

const API = import.meta.env.VITE_API_URL;
const TABS = ['📥 Importa', '🎬 Lista', '🎲 Scegli'];

export default function App() {
  const [tab, setTab] = useState(0);
  const [films, setFilms] = useState([]);

 const [serverError, setServerError] = useState(false);

const loadFilms = async () => {
  try {
    const res = await axios.get(`${API}/api/films`);
    setFilms(res.data);
    setServerError(false);
  } catch (err) {
    console.error('Server non raggiungibile:', err.message);
    setServerError(true);
  }
};

  useEffect(() => { loadFilms(); }, []);

  const unwatched = films.filter(f => !f.watched).length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ background: 'linear-gradient(90deg, #7c6af7, #f76ab4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎬 Film Picker
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>
          Importa da TvTime · gestisci la lista · trova il film di stasera
        </p>
      </div>

      {serverError && (
  <div style={{
    background: 'var(--danger)', color: 'white',
    borderRadius: 'var(--radius)', padding: '10px 16px',
    marginBottom: 16, fontSize: 13
  }}>
    ⚠️ Server non raggiungibile — controlla che il backend sia avviato.
    <span onClick={loadFilms} style={{ marginLeft: 8, cursor: 'pointer', textDecoration: 'underline' }}>
      Riprova
    </span>
  </div>
)}

      <div style={{ display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              flex: 1, background: tab === i ? 'var(--accent)' : 'transparent',
              color: tab === i ? 'white' : 'var(--muted)',
              borderRadius: 7, padding: '8px 0', fontWeight: tab === i ? 600 : 400
            }}>
            {t}{i === 1 && unwatched > 0 ? ` (${unwatched})` : ''}
          </button>
        ))}
      </div>

      {tab === 0 && <ImportTab api={API} onImport={(f) => { setFilms(f); setTab(1); }} />}
      {tab === 1 && <ListTab api={API} films={films} onUpdate={setFilms} />}
      {tab === 2 && <RandomTab films={films} onUpdate={setFilms} />}
    </div>
  );
}