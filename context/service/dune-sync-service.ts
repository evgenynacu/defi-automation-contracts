import { Pool, PoolClient } from 'pg'
import { DuneService } from './dune-service'

export interface DuneSyncOptions {
	queryId: string;
	tableName: string;
	apiKey: string;
	params?: Record<string, any>;
	pageSize?: number;
	truncateBeforeInsert?: boolean;
	schema?: string;
}

export interface SyncResult {
	success: boolean;
	totalRecords: number;
	totalPages: number;
	executionId: string;
	duration: number;
	tableName: string;
	error?: Error;
}

export class DuneSyncService {
	constructor(
		private readonly pool: Pool,
		private readonly duneService: DuneService
	) {
	}

	/**
	 * Executes Dune query, waits for completion, and saves all data to PostgreSQL
	 */
	async syncQueryToPostgres(options: DuneSyncOptions): Promise<SyncResult> {
		const startTime = Date.now()
		let client: PoolClient | null = null
		let executionId = ''
		let totalRecords = 0
		let totalPages = 0

		try {
			// Get a database client
			client = await this.pool.connect()

			// Execute query
			executionId = await this.duneService.executeQuery({
				queryId: options.queryId,
				params: options.params,
				apiKey: options.apiKey
			})

			console.log(`✓ Query executed. Execution ID: ${executionId}`)

			// Wait for completion
			await this.duneService.waitForExecution(executionId, options.apiKey)
			console.log(`✓ Query execution completed`)

			// Truncate table if requested
			if (options.truncateBeforeInsert) {
				await this.truncateTable(client, options.tableName, options.schema)
				console.log(`✓ Table ${this.getFullTableName(options.tableName, options.schema)} truncated`)
			}

			// Fetch and save data
			for await (const page of this.duneService.fetchAllPages<any>(
				executionId,
				options.apiKey,
				options.pageSize || 1000
			)) {
				totalPages++
				totalRecords += page.length

				if (page.length === 0) {
					console.log(`✓ Page ${totalPages}: No data to insert`)
					continue
				}

				// Insert data
				await this.insertPageData(client, options.tableName, page, options.schema)

				console.log(`✓ Page ${totalPages}: Inserted ${page.length} records (Total: ${totalRecords})`)
			}

			const duration = Date.now() - startTime

			console.log(`✓ Sync completed: ${totalRecords} records in ${totalPages} pages (${duration}ms)`)

			return {
				success: true,
				totalRecords,
				totalPages,
				executionId,
				duration,
				tableName: this.getFullTableName(options.tableName, options.schema)
			}

		} catch (error) {
			const duration = Date.now() - startTime

			console.error(`✗ Sync failed:`, error)

			return {
				success: false,
				totalRecords,
				totalPages,
				executionId,
				duration,
				tableName: this.getFullTableName(options.tableName, options.schema),
				error: error as Error
			}

		} finally {
			if (client) {
				client.release()
			}
		}
	}

	/**
	 * Inserts a page of data into the table
	 */
	private async insertPageData(
		client: PoolClient,
		tableName: string,
		data: any[],
		schema?: string
	): Promise<void> {
		if (data.length === 0) return

		const fullTableName = this.getFullTableName(tableName, schema)
		const sampleRecord = data[0]
		const columns = Object.keys(sampleRecord).map(key => this.sanitizeColumnName(key))

		// Build VALUES clause with placeholders
		const placeholders = data.map((_, rowIndex) => {
			const rowPlaceholders = columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`)
			return `(${rowPlaceholders.join(', ')})`
		}).join(', ')

		// Flatten all values for parameterized query
		const values = data.flatMap(record =>
			columns.map(col => {
				const originalKey = Object.keys(sampleRecord).find(k => this.sanitizeColumnName(k) === col)
				const value = originalKey ? record[originalKey] : null

				// Convert objects to JSON strings
				if (typeof value === 'object' && value !== null) {
					return JSON.stringify(value)
				}

				return value
			})
		)

		const insertQuery = `INSERT INTO ${fullTableName} (${columns.join(', ')}) VALUES ${placeholders}`
		console.log(insertQuery, values)
		await client.query(insertQuery, values)
	}

	/**
	 * Truncates the target table
	 */
	private async truncateTable(client: PoolClient, tableName: string, schema?: string): Promise<void> {
		const fullTableName = this.getFullTableName(tableName, schema)
		await client.query(`TRUNCATE TABLE ${fullTableName} RESTART IDENTITY`)
	}

	/**
	 * Sanitizes column names for PostgreSQL
	 */
	private sanitizeColumnName(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9_]/g, '_')
			.replace(/^(\d)/, '_$1') // Ensure doesn't start with number
			.substring(0, 63) // PostgreSQL identifier limit
	}

	/**
	 * Gets full table name with schema
	 */
	private getFullTableName(tableName: string, schema?: string): string {
		const schemaPrefix = schema ? `${schema}.` : ''
		return `${schemaPrefix}${tableName}`
	}

}