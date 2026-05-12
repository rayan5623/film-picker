import { useState } from 'react';
import axios from 'axios';
import { useLang } from '../LangContext';

export default function ListTab({ api, films, onUpdate }) {
  const { t } = useLang();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [type, setType] = useState('film');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [feedback, setFeedback] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      const res = await axios.post(`${api}/api/films`, { title: title.trim(), genre, type });
      onUpdate(res.data);
      setTitle(''); setGenre('');
      setFeedback(`"${title.trim()}" aggiunto!`);
      setTimeout(() => setFeedback(''), 2500);
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Errore');
      setTimeout(() => setFeedback(''), 2500);
    }
  };

  const handleToggle = async (id) => {
    const res = await axios.patch(`${api}/api/films/${id}/toggle`);
    onUpdate(res.data);
  };

  const handleRemove = async (id) => {
    const res = await axios.delete(`${api}/api/films/${id}`);
    onUpdate(res.data);
  };

  const sorted = [...films].sort((a, b) => {
    if (sort === 'newest') return b.id - a.id;
    if (sort === 'oldest') return a.id - b.id;
    if (sort === 'az') return a.title.localeCompare(b.title);
    if (sort === 'za') return b.title.localeCompare(a.title);
    return 0;
  });

  const visible = sorted.filter(f => {
    if (filter === 'unwatched' && f.watched) return false;
    if (filter === 'watched' && !f.watched) return false;
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = films.length;
  const watched = films.filter(f => f.watched).length;
  const unwatched = total - watched;

  return (
    <div>
      {/* Contatore */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: t.list.total, value: total, color: 'var(--accent)' },
          { label: t.list.toWatch, value: unwatched, color: 'var(--success)' },
          { label: t.list.seen, value: watched, color: 'var(--muted)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, background: 'var(--surface)', borderRadius: 'var(--radius)',
            padding: '12px 0', textAlign: 'center'
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Aggiunta manuale */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input style={{ flex: 1, minWidth: 140 }} placeholder={t.list.titlePlaceholder}
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input style={{ width: 120 }} placeholder={t.list.genrePlaceholder}
          value={genre} onChange={e => setGenre(e.target.value)} />
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="film">🎬 Film</option>
          <option value="serie">📺 Serie</option>
        </select>
        <button onClick={handleAdd}>{t.list.addBtn}</button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ fontSize: 13, color: 'var(--success)', marginBottom: 8 }}>
          ✓ {feedback}
        </div>
      )}

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ width: 140 }} placeholder={t.list.searchPlaceholder}
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">{t.list.all}</option>
          <option value="unwatched">{t.list.unwatched}</option>
          <option value="watched">{t.list.watched}</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">{t.list.allTypes}</option>
          <option value="film">{t.list.onlyFilms}</option>
          <option value="serie">{t.list.onlySeries}</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">{t.list.newest}</option>
          <option value="oldest">{t.list.oldest}</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>
          {visible.length} {t.list.titles}
        </span>
      </div>

      {visible.length === 0 && (
        <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 32 }}>
          {films.length === 0 ? t.list.empty : t.list.notFound}
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
                {f.type === 'serie' ? '📺' : '🎬'} {f.title}
              </div>
              {f.genre && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{f.genre}</div>}
            </div>
            <button onClick={() => handleToggle(f.id)}
              style={{ background: f.watched ? 'var(--surface2)' : 'var(--success)',
                color: f.watched ? 'var(--muted)' : '#0f0f13', padding: '6px 12px', fontSize: 13 }}>
              {f.watched ? t.list.rewatch_btn : t.list.watched_btn}
            </button>
            <button onClick={() => handleRemove(f.id)}
              className="danger" style={{ padding: '6px 10px' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}