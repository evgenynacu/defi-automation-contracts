import migrate from 'node-pg-migrate'
import { Client } from 'pg'
import path from 'path'

export async function runMigrations(connectionString: string) {
	console.log('Starting database migrations...')

	const migrationsDirectory = path.resolve(__dirname, './migrations')
	const client = new Client({ connectionString })
	await client.connect()
	try {
		const result = await migrate({
			dir: migrationsDirectory,
			migrationsTable: 'pgmigrations',
			timestamp: false,
			verbose: true,
			count: undefined,
			direction: 'up',
			dbClient: client,
			logger: console,
		})

		console.log(`Database migrations completed successfully: ${result.length} migrations applied`)
		return true
	} catch (error) {
		console.error('Migration failed:', error)
		throw error
	} finally {
		await client.end().catch(e => console.error('Failed to end migration client:', e))
	}
}
