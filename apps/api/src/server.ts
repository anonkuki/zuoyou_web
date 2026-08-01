import { createApp } from './app.js';

const production = process.env.NODE_ENV === 'production';
const app = await createApp({
  databasePath: process.env.DATABASE_PATH ?? './data/guild.sqlite',
  uploadRoot: process.env.UPLOAD_ROOT ?? './data/uploads',
  sessionSecret: process.env.SESSION_SECRET ?? (production ? '' : 'development-session-secret-change-me'),
  seed: process.env.SEED_DATABASE !== 'false',
  adminPassword: process.env.ADMIN_PASSWORD,
  production,
});

await app.listen({ host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 3100) });

