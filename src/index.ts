import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import dotenv from 'dotenv';
dotenv.config();

import { bookingRouter } from './routes/bookings';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { pricingRouter } from './routes/pricing';
import { slotsRouter } from './routes/slots';
import { initTelegramBot } from './bot/telegramBot';

const dev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT || '4000', 10);
const frontendDir = path.join(__dirname, '..', 'frontend');

async function main() {
  // Init Next.js
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const next = require('next');
  const nextApp = next({ dev, dir: frontendDir });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const app = express();

  // Security
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10kb' }));

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Слишком много запросов. Попробуйте позже.' },
  });
  const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Превышен лимит заявок. Попробуйте через час.' },
    keyGenerator: (req) => req.body?.customer_phone || req.ip || 'unknown',
  });

  app.use(generalLimiter);

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/bookings', bookingLimiter, bookingRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/pricing', pricingRouter);
  app.use('/api/slots', slotsRouter);

  // Health check
  app.get('/health', (_, res) => {
    res.json({ status: 'ok', service: 'Taj Paintball', timestamp: new Date().toISOString() });
  });

  // All other routes → Next.js
  app.all('*', (req, res) => handle(req, res));

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  createServer(app).listen(PORT, () => {
    console.log(`🎯 Taj Paintball running on http://localhost:${PORT}`);
    console.log(`   Mode: ${dev ? 'development' : 'production'}`);
    initTelegramBot();
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
