import { useState } from 'react';
import axios from 'axios';

export default function ListTab({ api, films, onUpdate }) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const handleAdd = async () => {
    if (!title.trim()) return;
    const res = await axios.post(`${api}/api/films`, { title: title.trim(), genre });
    onUpdate(res.data);
    setTitle(''); setGenre('');
  };

  const handleToggle = async (id) => {
    const res = await axios.patch(`${api}/api/films/${id}/toggle`);
    onUpdate(res.data);
  };

  const handleRemove = async (id) => {
    const res = await axios.delete(`${api}/api/films/${id}`);
    onUpdate(res.data);
  };

  const visible = films.filter(f => {
    if (filter === 'unwatched' && f.watched) return false;
    if (filter === 'watched' && !f.watched) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ flex: 1, minWidth: 140 }} placeholder="Titolo..."
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input style={{ width: 140 }} placeholder="Genere..."
          value={genre} onChange={e => setGenre(e.target.value)} />
        <button onClick={handleAdd}>+ Aggiungi</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ width: 160 }} placeholder="🔍 Cerca..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tutti</option>
          <option value="unwatched">Da vedere</option>
          <option value="watched">Già visti</option>
        </select>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>
          {visible.length} film
        </span>
      </div>

      {visible.length === 0 && (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 32 }}>
          Nessun film trovato.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(f => (
          <div key={f.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface)', borderRadius: 'var(--radius)',
            padding: '12px 16px', opacity: f.watched ? 0.45 : 1,
            transition: 'opacity 0.2s'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, textDecoration: f.watched ? 'line-through' : 'none' }}>
                {f.title}
              </div>
              {f.genre && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{f.genre}</div>}
            </div>
            <button onClick={() => handleToggle(f.id)}
              style={{ background: f.watched ? 'var(--surface2)' : 'var(--success)',
                color: f.watched ? 'var(--muted)' : '#0f0f13', padding: '6px 12px', fontSize: 13 }}>
              {f.watched ? '↩ Rivedi' : '✓ Visto'}
            </button>
            <button onClick={() => handleRemove(f.id)}
              className="danger" style={{ padding: '6px 10px' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}