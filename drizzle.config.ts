import type { Config } from 'drizzle-kit';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const config: Config = {
  schema: './src/lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};

export default config;
