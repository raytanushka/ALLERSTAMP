require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { ALLERGENS } = require('./src/allergens');
const profileRoutes = require('./src/routes/profile');
const scanRoutes = require('./src/routes/scan');
const explainRoutes = require('./src/routes/explain');
const compareRoutes = require('./src/routes/compare');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'allerstamp-backend' }));
app.get('/api/allergens', (req, res) => res.json(ALLERGENS));

app.use('/api/profile', profileRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/scan', explainRoutes); // adds POST /api/scan/:id/explain
app.use('/api/compare', compareRoutes);

// Serve the built frontend if it's present alongside the backend
// (see ../frontend or a copied ./public folder in deployment).
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(staticDir, 'index.html'), err => { if (err) next(); });
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`AllerStamp backend listening on http://localhost:${PORT}`);
});
