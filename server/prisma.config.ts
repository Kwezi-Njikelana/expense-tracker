import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Not every command needs a database (e.g. `prisma generate` on install).
    url: process.env.DATABASE_URL ?? '',
  },
});
