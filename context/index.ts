import { Pool } from "pg";
import { runMigrations } from "./db/run-migrations"


export type Context = {
	connectionPool: Pool
}

export async function createContext(): Promise<Context> {
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres",
	});

	await runMigrations(pool)

	return {
		connectionPool: pool,
	}
}