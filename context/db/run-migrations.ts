// migrate.ts
import migrate from 'node-pg-migrate'
import { Pool } from 'pg'
import path from 'path'
import { wallets } from "../wallets"
import { marketIds } from "../morpho"
import { aaveVaults } from "../aave"
import { tokens } from "../tokens"

export async function runMigrations(pool: Pool) {
	try {
		console.log('Starting database migrations...')

		// Путь к директории с миграциями
		const migrationsDirectory = path.resolve(__dirname, './migrations')
		const client = await pool.connect()

		// Запускаем миграции
		const result = await migrate({
			// Директория с файлами миграций
			dir: migrationsDirectory,
			// Имя таблицы для отслеживания миграций
			migrationsTable: 'pgmigrations',
			// Показывать SQL-запросы в консоли перед выполнением
			verbose: true,
			// Количество миграций для применения (undefined = все)
			count: undefined,
			// Направление миграции (up = применение, down = откат)
			direction: 'up',
			// Подключение к базе данных
			dbClient: client,
			// Опция для логгирования
			logger: console,
		})

		console.log("Updating jobs")
		await updateJobs(pool)

		console.log(`Database migrations completed successfully: ${result.length} migrations applied`)
		return true
	} catch (error) {
		console.error('Migration failed:', error)
		throw error
	}
}

async function updateJobs(pool: Pool) {
	const jobs: { id: string, name: string }[] = []
	for (const wallet of Object.keys(wallets)) {
		for (const marketId of Object.keys(marketIds)) {
			const id = `morpho-withdraw-${wallet}-${marketId}`
			const name = `Morpho ${marketIds[marketId]} [${wallets[wallet]}]`
			jobs.push({ id, name })
			console.log("Registered job " + id + " = " + name)
		}
	}

	for(const vault of aaveVaults) {
		const id = `aave-withdraw-${vault.vault}-${vault.collateral}-${vault.debt}`
		const name = `Aave ${tokens[vault.collateral]} [${wallets[vault.owner]}]`
		jobs.push({ id, name })
		console.log("Registered job " + id + " = " + name)
	}

	const client = await pool.connect()
	try {
		for (const job of jobs) {
			client.query("BEGIN")
			await client.query(
				`
          INSERT INTO jobs (id, name)
          VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
			`,
				[job.id, job.name],
			)
		}
		client.query("COMMIT")
	} catch(e) {
		client.query("ROLLBACK")
	} finally {
		client.release()
	}
}