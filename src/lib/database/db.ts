import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const connectionString = process.env.DATABASE_URL;
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

const checkDbConnection = async () => {
    try {
        await client`SELECT 1`;
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
};

checkDbConnection();
