const fs = require('fs');
const path = require('path');
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}
const express = require('express');
const { ensureSchema } = require('./db/bootstrap');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const ufRoutes = require('./routes/uf');
const userRoutes = require('./routes/users');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  const acrh = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Headers', acrh || 'Content-Type,Authorization');
  if (req.headers['access-control-request-private-network'] === 'true') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', listingsRoutes);
app.use('/api', ufRoutes);
app.use('/api/users', userRoutes);

const port = Number(process.env.PORT) || 3001;

async function start() {
  await ensureSchema();
  app.listen(port, '0.0.0.0');
}

start().catch((err) => {
  process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
  process.exit(1);
});
