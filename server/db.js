import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'films.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS films (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    genre TEXT DEFAULT '',
    type TEXT DEFAULT 'film',
    watched INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// migration per db esistenti
try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_films_title ON films(title)`);
} catch(e) {
  // indice già esistente, ignora
}

export const getAll = () => db.prepare('SELECT * FROM films ORDER BY created_at DESC').all();
export const insert = (title, genre, type = 'film') =>
  db.prepare('INSERT INTO films (title, genre, type) VALUES (?, ?, ?)').run(title, genre, type);
export const toggleWatched = (id) => db.prepare('UPDATE films SET watched = NOT watched WHERE id = ?').run(id);
export const remove = (id) => db.prepare('DELETE FROM films WHERE id = ?').run(id);
export const bulkInsert = (films) => {
  const stmt = db.prepare('INSERT OR IGNORE INTO films (title, genre, type) VALUES (?, ?, ?)');
  const insertMany = db.transaction((list) => {
    for (const f of list) stmt.run(f.title, f.genre || '', f.type || 'film');
  });
  insertMany(films);
};