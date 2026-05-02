import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { getAll, insert, toggleWatched, remove, bulkInsert } from './db.js';
import helmet from 'helmet';

dotenv.config();

const app = express();
const upload = multer();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// sostituisci app.use(cors()) con questo:
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173'];

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// CRUD films
app.get('/api/films', (req, res) => {
  res.json(getAll());
});

app.post('/api/films', (req, res) => {
  const { title, genre } = req.body;
  if (!title) return res.status(400).json({ error: 'Titolo obbligatorio' });
  insert(title, genre || '');
  res.json(getAll());
});

app.patch('/api/films/:id/toggle', (req, res) => {
  toggleWatched(req.params.id);
  res.json(getAll());
});

app.delete('/api/films/:id', (req, res) => {
  remove(req.params.id);
  res.json(getAll());
});

app.post('/api/films/bulk', (req, res) => {
  const { films } = req.body;
  if (!films?.length) return res.status(400).json({ error: 'Nessun film' });
  bulkInsert(films);
  res.json(getAll());
});

// Import CSV
app.post('/api/import/csv', upload.single('file'), (req, res) => {
  try {
    const text = req.file.buffer.toString('utf8');
    const lines = text.trim().split('\n').slice(1);
    const films = lines
      .map(line => {
        const [title, genre] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        return title ? { title, genre: genre || '' } : null;
      })
      .filter(Boolean);
    bulkInsert(films);
    res.json({ imported: films.length, films: getAll() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Extract da screenshot
app.post('/api/extract', upload.single('image'), async (req, res) => {
  try {
    const base64 = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: 'Questa è una screenshot della watchlist film di TvTime. Estrai tutti i titoli visibili con i loro generi. Rispondi SOLO con JSON array, nessun testo extra, nessun markdown. Formato: [{"title":"Titolo","genre":"Genere1, Genere2"}]. Se non trovi film: []'
          }
        ]
      }]
    });

    const text = response.content[0].text.trim();
let films = [];
try {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  films = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
} catch (parseErr) {
  console.error('JSON malformato da Anthropic:', text);
  films = [];
}
res.json({ films });
  } catch (err) {
    console.error('ERRORE:', err.message);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));