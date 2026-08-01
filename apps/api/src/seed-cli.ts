import { openDatabase, seedDatabase } from './database.js';

const production = process.env.NODE_ENV === 'production';
const { sqlite } = await openDatabase(process.env.DATABASE_PATH ?? './data/guild.sqlite');
try {
  await seedDatabase(sqlite, { production, adminPassword: process.env.ADMIN_PASSWORD });
  process.stdout.write('Adventurer Guild database seed complete.\n');
} finally {
  sqlite.close();
}

