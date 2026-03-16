import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Prevent connecting to the DB during build time when the URL isn't available
const connectionString = process.env.DATABASE_URL || 'postgres://dummy:dummy@localhost:5432/dummy';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });