import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { runSeed } from './seed/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Phục vụ ảnh upload (menu, ...) — đặt trước catch-all của client
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

app.use('/api', apiRoutes);

// Phục vụ client đã build ở production
if (isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    await runSeed();
    app.listen(PORT, () => console.log(`✓ Bloom Coffee API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Khởi động thất bại:', err);
    process.exit(1);
  }
}

start();
