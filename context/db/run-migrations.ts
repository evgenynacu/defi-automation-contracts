// migrate.ts
import migrate from 'node-pg-migrate';
import { Pool } from 'pg';
import path from 'path';

export async function runMigrations(pool: Pool) {
	try {
		console.log('Starting database migrations...');

		// Путь к директории с миграциями
		const migrationsDirectory = path.resolve(__dirname, './migrations');
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
		});

		console.log(`Database migrations completed successfully: ${result.length} migrations applied`);
		return true;
	} catch (error) {
		console.error('Migration failed:', error);
		throw error;
	}
}
