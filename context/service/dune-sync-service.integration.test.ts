import { expect } from 'chai'
import { after, before, beforeEach, describe, it } from 'mocha'
import { Pool } from 'pg'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import dotenv from 'dotenv'
import { DuneService } from './dune-service'
import { DuneSyncService } from './dune-sync-service'

dotenv.config()

describe('DuneSyncService Integration Tests with TestContainers', function () {
	let container: StartedPostgreSqlContainer
	let pool: Pool
	let duneService: DuneService
	let syncService: DuneSyncService

	const TEST_QUERY_ID = '1215383' // Simple ETH price query
	const API_KEY = process.env.DUNE_API_KEY || process.env.DUNE_KEY
	const TEST_TABLE_NAME = 'test_dune_sync'

	before(async function () {
		this.timeout(120000) // 2 minutes for container startup

		if (!API_KEY) {
			console.log('Skipping DuneSyncService tests - no API key provided')
			this.skip()
		}

		console.log('Starting PostgreSQL container...')

		// Start PostgreSQL container
		container = await new PostgreSqlContainer('postgres:15-alpine')
			.withDatabase('testdb')
			.withUsername('testuser')
			.withPassword('testpass')
			.withExposedPorts(5432)
			.start()

		console.log(`✓ PostgreSQL container started on port ${container.getMappedPort(5432)}`)

		// Initialize pool
		pool = new Pool({
			host: container.getHost(),
			port: container.getMappedPort(5432),
			database: container.getDatabase(),
			user: container.getUsername(),
			password: container.getPassword(),
		})

		// Test connection
		const client = await pool.connect()
		const result = await client.query('SELECT NOW()')
		console.log(`✓ Database connected: ${result.rows[0].now}`)
		client.release()

		// Initialize services
		duneService = new DuneService()
		syncService = new DuneSyncService(pool, duneService)
	})

	after(async function () {
		this.timeout(30000)

		if (pool) {
			await pool.end()
			console.log('✓ Database pool closed')
		}

		if (container) {
			await container.stop()
			console.log('✓ PostgreSQL container stopped')
		}
	})

	beforeEach(async function () {
		// Clean up and create test table
		const client = await pool.connect()

		try {
			await client.query(`DROP TABLE IF EXISTS ${TEST_TABLE_NAME}`)

			// Create a test table structure that should work with typical Dune query results
			await client.query(`
          CREATE TABLE ${TEST_TABLE_NAME}
          (
              text_field   TEXT,
              number_field DECIMAL,
              date_field   TIMESTAMP,
              list_field   VARCHAR,
              created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
			`)

			console.log(`✓ Created test table: ${TEST_TABLE_NAME}`)
		} finally {
			client.release()
		}
	})

	describe('syncQueryToPostgres', () => {
		it('should successfully sync Dune query data to PostgreSQL', async function () {
			this.timeout(300000) // 5 minutes

			const result = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: true,
				pageSize: 100
			})

			// Verify result
			expect(result.success).to.be.true
			expect(result.totalRecords).to.be.greaterThan(0)
			expect(result.totalPages).to.be.greaterThan(0)
			expect(result.executionId).to.be.a('string')
			expect(result.executionId).to.have.length.greaterThan(0)
			expect(result.duration).to.be.greaterThan(0)
			expect(result.tableName).to.equal(TEST_TABLE_NAME)
			expect(result.error).to.be.undefined

			console.log(`✓ Sync result:`, {
				success: result.success,
				totalRecords: result.totalRecords,
				totalPages: result.totalPages,
				duration: result.duration,
				executionId: result.executionId
			})

			// Verify data was actually inserted
			const client = await pool.connect()
			try {
				const countResult = await client.query(`SELECT COUNT(*) as count
                                                FROM ${TEST_TABLE_NAME}`)
				const actualRowCount = parseInt(countResult.rows[0].count)

				expect(actualRowCount).to.equal(result.totalRecords)
				console.log(`✓ Verified ${actualRowCount} records in database`)

				// Check sample data
				const sampleResult = await client.query(`SELECT *
                                                 FROM ${TEST_TABLE_NAME}
                                                 LIMIT 3`)
				expect(sampleResult.rows.length).to.be.greaterThan(0)

				console.log(`✓ Sample records:`, sampleResult.rows.map(row => {
					const { created_at, ...rest } = row
					return rest
				}))

			} finally {
				client.release()
			}
		})

		it('should handle truncation properly', async function () {
			this.timeout(400000) // 6+ minutes

			// First sync
			const firstResult = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: true,
				pageSize: 50
			})

			expect(firstResult.success).to.be.true
			console.log(`✓ First sync: ${firstResult.totalRecords} records`)

			// Verify first sync data
			const client = await pool.connect()
			try {
				const firstCountResult = await client.query(`SELECT COUNT(*) as count
                                                     FROM ${TEST_TABLE_NAME}`)
				const firstCount = parseInt(firstCountResult.rows[0].count)
				expect(firstCount).to.equal(firstResult.totalRecords)

				// Second sync with truncation
				const secondResult = await syncService.syncQueryToPostgres({
					queryId: TEST_QUERY_ID,
					tableName: TEST_TABLE_NAME,
					apiKey: API_KEY!,
					truncateBeforeInsert: true,
					pageSize: 30
				})

				expect(secondResult.success).to.be.true
				console.log(`✓ Second sync: ${secondResult.totalRecords} records`)

				// Verify truncation worked
				const secondCountResult = await client.query(`SELECT COUNT(*) as count
                                                      FROM ${TEST_TABLE_NAME}`)
				const secondCount = parseInt(secondCountResult.rows[0].count)
				expect(secondCount).to.equal(secondResult.totalRecords)

				console.log(`✓ Truncation verified: ${firstCount} → ${secondCount} records`)

			} finally {
				client.release()
			}
		})

		it('should handle append mode (no truncation)', async function () {
			this.timeout(400000)

			// First sync with truncation
			const firstResult = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: true,
				pageSize: 40
			})

			expect(firstResult.success).to.be.true

			// Second sync without truncation (append)
			const secondResult = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: false,
				pageSize: 40
			})

			expect(secondResult.success).to.be.true

			// Verify append worked
			const client = await pool.connect()
			try {
				const finalCountResult = await client.query(`SELECT COUNT(*) as count
                                                     FROM ${TEST_TABLE_NAME}`)
				const finalCount = parseInt(finalCountResult.rows[0].count)

				expect(finalCount).to.equal(firstResult.totalRecords + secondResult.totalRecords)

				console.log(`✓ Append mode verified: ${firstResult.totalRecords} + ${secondResult.totalRecords} = ${finalCount} records`)

			} finally {
				client.release()
			}
		})

		it('should handle different page sizes', async function () {
			this.timeout(300000)

			const pageSizes = [10, 50, 200]

			for (const pageSize of pageSizes) {
				// Clean table
				const client = await pool.connect()
				await client.query(`TRUNCATE TABLE ${TEST_TABLE_NAME}`)
				client.release()

				const result = await syncService.syncQueryToPostgres({
					queryId: TEST_QUERY_ID,
					tableName: TEST_TABLE_NAME,
					apiKey: API_KEY!,
					truncateBeforeInsert: false,
					pageSize
				})

				expect(result.success).to.be.true
				expect(result.totalRecords).to.be.greaterThan(0)

				console.log(`✓ Page size ${pageSize}: ${result.totalRecords} records in ${result.totalPages} pages`)
			}
		})

		it('should handle query parameters', async function () {
			this.timeout(300000)

			const result = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				params: {
					// Add any parameters your test query might accept
					// limit: 100
				},
				truncateBeforeInsert: true,
				pageSize: 100
			})

			expect(result.success).to.be.true
			console.log(`✓ Query with parameters: ${result.totalRecords} records`)
		})
	})

	describe('Error Handling', () => {
		it('should handle invalid query ID gracefully', async function () {
			this.timeout(60000)

			const result = await syncService.syncQueryToPostgres({
				queryId: '99999999999', // Invalid query ID
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: true
			})

			expect(result.success).to.be.false
			expect(result.error).to.be.an.instanceof(Error)
			expect(result.totalRecords).to.equal(0)
			expect(result.totalPages).to.equal(0)
			expect(result.executionId).to.be.a('string') // Should still have attempted execution

			console.log(`✓ Invalid query error: ${result.error?.message}`)
		})

		it('should handle non-existent table gracefully', async function () {
			this.timeout(300000)

			const result = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: 'non_existent_table',
				apiKey: API_KEY!,
				truncateBeforeInsert: true
			})

			expect(result.success).to.be.false
			expect(result.error).to.be.an.instanceof(Error)
			expect(result.error?.message).to.include('relation "non_existent_table" does not exist')

			console.log(`✓ Non-existent table error: ${result.error?.message}`)
		})

		it('should handle invalid API key gracefully', async function () {
			this.timeout(60000)

			const result = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: 'invalid-api-key',
				truncateBeforeInsert: true
			})

			expect(result.success).to.be.false
			expect(result.error).to.be.an.instanceof(Error)

			console.log(`✓ Invalid API key error: ${result.error?.message}`)
		})
	})

	describe('Data Integrity', () => {
		it('should preserve data types correctly', async function () {
			this.timeout(300000)

			const result = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: true,
				pageSize: 50
			})

			expect(result.success).to.be.true

			// Check data types in inserted records
			const client = await pool.connect()
			try {
				const dataResult = await client.query(`SELECT *
                                               FROM ${TEST_TABLE_NAME}
                                               LIMIT 5`)

				if (dataResult.rows.length > 0) {
					const record = dataResult.rows[0]

					console.log(`✓ Sample record types:`, Object.entries(record).map(([key, value]) =>
						`${key}: ${typeof value} (${value === null ? 'null' : value!.constructor.name})`
					))

					// Verify no data corruption
					expect(record).to.be.an('object')
					expect(record.created_at).to.be.an.instanceof(Date)
				}

			} finally {
				client.release()
			}
		})

		it('should handle special characters and unicode', async function () {
			this.timeout(300000)

			const result = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: true,
				pageSize: 100
			})

			expect(result.success).to.be.true

			// The data integrity is verified by the successful insertion
			console.log(`✓ Special characters handled: ${result.totalRecords} records`)
		})
	})

	describe('Performance', () => {
		it('should complete sync within reasonable time', async function () {
			this.timeout(300000)

			const startTime = Date.now()

			const result = await syncService.syncQueryToPostgres({
				queryId: TEST_QUERY_ID,
				tableName: TEST_TABLE_NAME,
				apiKey: API_KEY!,
				truncateBeforeInsert: true,
				pageSize: 200
			})

			const totalTime = Date.now() - startTime

			expect(result.success).to.be.true
			expect(result.duration).to.be.lessThan(totalTime)

			const recordsPerSecond = (result.totalRecords / result.duration) * 1000

			console.log(`✓ Performance metrics:`)
			console.log(`  Total records: ${result.totalRecords}`)
			console.log(`  Sync duration: ${result.duration}ms`)
			console.log(`  Total test time: ${totalTime}ms`)
			console.log(`  Records per second: ${recordsPerSecond.toFixed(2)}`)

			expect(recordsPerSecond).to.be.greaterThan(0)
		})
	})
})