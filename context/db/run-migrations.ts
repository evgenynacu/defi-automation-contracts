// migrate.ts
import migrate from 'node-pg-migrate'
import { Pool } from 'pg'
import path from 'path'

export async function runMigrations(pool: Pool) {
	try {
		console.log('Starting database migrations...')

		// Путь к директории с миграциями
		const migrationsDirectory = path.resolve(__dirname, './migrations')
		const client = await pool.connect()

		// Запускаем миграции
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
	}
}