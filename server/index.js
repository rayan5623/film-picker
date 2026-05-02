import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import Anthropic from '@anthropic-ai/sdk';
import { getAll, insert, toggleWatched, remove, bulkInsert } from './db.js';

dotenv.config();

const app = express();

// per immagini
const uploadImage = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo immagini accettate'));
    }
    cb(null, true);
  }
});

// per CSV
const uploadCSV = multer({
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.includes('csv') && !file.mimetype.includes('text')) {
      return cb(new Error('Solo file CSV accettati'));
    }
    cb(null, true);
  }
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const extractLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: { error: 'Hai raggiunto il limite di 5 import AI gratuiti al giorno. Riprova domani!' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Troppe richieste, rallenta!' }
});

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173'];

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CRUD films
app.get('/api/films', (req, res) => {
  res.json(getAll());
});

app.post('/api/films', (req, res) => {
  const { title, genre } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Titolo obbligatorio' });
  if (title.length > 200) return res.status(400).json({ error: 'Titolo troppo lungo' });
  insert(title.trim(), (genre || '').slice(0, 200));
  res.json(getAll());
});

app.patch('/api/films/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });
  toggleWatched(id);
  res.json(getAll());
});

app.delete('/api/films/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID non valido' });
  remove(id);
  res.json(getAll());
});

app.post('/api/films/bulk', (req, res) => {
  const { films } = req.body;
  if (!films?.length) return res.status(400).json({ error: 'Nessun film' });
  if (films.length > 100) return res.status(400).json({ error: 'Massimo 100 film per volta' });
  bulkInsert(films);
  res.json(getAll());
});

// Import CSV
app.post('/api/import/csv', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File mancante' });
    const text = req.file.buffer.toString('utf8');
    const lines = text.trim().split('\n').slice(1);
    const films = lines
      .map(line => {
        const [title, genre] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        return title ? { title: title.slice(0, 200), genre: (genre || '').slice(0, 200) } : null;
      })
      .filter(Boolean)
      .slice(0, 500);
    bulkInsert(films);
    res.json({ imported: films.length, films: getAll() });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel parsing del CSV' });
  }
});

// Extract da screenshot
app.post('/api/extract', extractLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Immagine mancante' });

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
    console.error('ERRORE extract:', err.message);
    if (err.status === 401) return res.status(500).json({ error: 'Errore di autenticazione AI' });
    if (err.status === 429) return res.status(429).json({ error: 'Servizio AI sovraccarico, riprova tra poco' });
    res.status(500).json({ error: 'Errore durante l\'estrazione, riprova' });
  }
});

// Gestione errori multer
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Immagine troppo grande (max 5MB)' });
  if (err.message === 'Solo immagini accettate') return res.status(400).json({ error: err.message });
  res.status(500).json({ error: 'Errore interno del server' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));