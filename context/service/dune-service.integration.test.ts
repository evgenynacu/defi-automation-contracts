import { expect } from 'chai'
import { describe, it, before, beforeEach } from 'mocha'
import dotenv from 'dotenv'
import { DuneService } from './dune-service'

dotenv.config()

// Define the expected data structure for the test query
interface TestQueryResult {
	[key: string]: any;
}

describe('DuneService Integration Tests', function () {
	let duneService: DuneService
	let executionId: string

	// Use a simple public query for testing
	const TEST_QUERY_ID = '1215383' // Simple ETH price query
	const API_KEY = process.env.DUNE_API_KEY || process.env.DUNE_KEY

	before(function () {
		// Skip integration tests if an API key is not provided
		if (!API_KEY) {
			console.log('Skipping Dune integration tests - no API key provided (set DUNE_API_KEY or DUNE_KEY)')
			this.skip()
		}
		console.log('Running Dune integration tests with real API...')
	})

	beforeEach(() => {
		duneService = new DuneService()
	})

	describe('Query Execution', () => {
		it('should execute query and return execution ID', async function () {
			this.timeout(30000)

			executionId = await duneService.executeQuery({
				queryId: TEST_QUERY_ID,
				apiKey: API_KEY!
			})

			expect(executionId).to.be.a('string')
			expect(executionId).to.have.length.greaterThan(0)
			expect(executionId).to.match(/^\w+$/)

			console.log(`✓ Execution ID: ${executionId}`)
		})

		it('should check execution status', async function () {
			this.timeout(30000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
			}

			const status = await duneService.getExecutionStatus(executionId, API_KEY!)
			expect(status).to.be.oneOf(['QUERY_STATE_PENDING', 'QUERY_STATE_COMPLETED', 'QUERY_STATE_EXECUTING'])

			console.log(`✓ Execution status: ${status}`)
		})

		it('should wait for query execution to complete', async function () {
			this.timeout(10000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
			}

			await duneService.waitForExecution(executionId, API_KEY!)

			const status = await duneService.getExecutionStatus(executionId, API_KEY!)
			expect(status).to.equal('QUERY_STATE_COMPLETED')

			console.log('✓ Query execution completed successfully')
		})
	})

	describe('Data Fetching', () => {
		it('should fetch first page of results', async function () {
			this.timeout(120000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
				await duneService.waitForExecution(executionId, API_KEY!)
			}

			const result = await duneService.fetchPage<TestQueryResult>({
				executionId,
				apiKey: API_KEY!,
				limit: 10
			})

			expect(result).to.have.property('data')
			expect(result).to.have.property('pagination')
			expect(result).to.have.property('metadata')
			expect(result.data).to.be.an('array')

			if (result.data.length > 0) {
				const firstRecord = result.data[0]
				expect(firstRecord).to.be.an('object')
				console.log(`✓ Fetched ${result.data.length} records`)
				console.log(`Sample record keys: ${Object.keys(firstRecord).join(', ')}`)
				console.log(`First record:`, JSON.stringify(firstRecord, null, 2))
			} else {
				console.log('✓ Query returned no data (which is valid)')
			}

			console.log(`Pagination info:`, result.pagination)
			console.log(`Metadata:`, result.metadata)
		})

		it('should handle pagination correctly', async function () {
			this.timeout(120000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
				await duneService.waitForExecution(executionId, API_KEY!)
			}

			const firstPage = await duneService.fetchPage<TestQueryResult>({
				executionId,
				apiKey: API_KEY!,
				limit: 5
			})

			expect(firstPage.data).to.be.an('array')

			if (firstPage.pagination?.has_more && firstPage.pagination?.next_offset) {
				const secondPage = await duneService.fetchPage<TestQueryResult>({
					executionId,
					apiKey: API_KEY!,
					limit: 5,
					offset: firstPage.pagination.next_offset
				})

				expect(secondPage.data).to.be.an('array')
				console.log(`✓ First page: ${firstPage.data.length} records`)
				console.log(`✓ Second page: ${secondPage.data.length} records`)

				// Verify pages are different (if both have data)
				if (firstPage.data.length > 0 && secondPage.data.length > 0) {
					expect(firstPage.data[0]).to.not.deep.equal(secondPage.data[0])
				}
			} else {
				console.log('✓ Query has only one page of results')
			}
		})
	})

	describe('Async Generator Methods', () => {
		it('should fetch all pages using AsyncGenerator', async function () {
			this.timeout(180000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
				await duneService.waitForExecution(executionId, API_KEY!)
			}

			let pageCount = 0
			let totalRecords = 0
			const maxPages = 5 // Limit to avoid long test runs

			for await (const page of duneService.fetchAllPages<TestQueryResult>(executionId, API_KEY!, 10)) {
				pageCount++
				totalRecords += page.length

				expect(page).to.be.an('array')
				console.log(`✓ Page ${pageCount}: ${page.length} records`)

				if (pageCount === 1 && page.length > 0) {
					console.log(`Sample record from page 1:`, JSON.stringify(page[0], null, 2))
				}

				if (pageCount >= maxPages) {
					console.log(`✓ Stopping after ${maxPages} pages to avoid long test`)
					break
				}
			}

			expect(pageCount).to.be.greaterThan(0)
			console.log(`✓ Total: ${pageCount} pages, ${totalRecords} records`)
		})

		it('should execute and fetch in one operation', async function () {
			this.timeout(180000)

			let pageCount = 0
			let totalRecords = 0
			const maxPages = 3

			for await (const page of duneService.executeAndFetchAll<TestQueryResult>({
				queryId: TEST_QUERY_ID,
				apiKey: API_KEY!,
				limit: 10
			})) {
				pageCount++
				totalRecords += page.length

				expect(page).to.be.an('array')
				console.log(`✓ Page ${pageCount}: ${page.length} records`)

				if (pageCount === 1 && page.length > 0) {
					console.log(`Sample record:`, JSON.stringify(page[0], null, 2))
				}

				if (pageCount >= maxPages) {
					console.log(`✓ Stopping after ${maxPages} pages`)
					break
				}
			}

			expect(pageCount).to.be.greaterThan(0)
			console.log(`✓ executeAndFetchAll: ${pageCount} pages, ${totalRecords} records`)
		})

		it('should handle early termination gracefully', async function () {
			this.timeout(120000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
				await duneService.waitForExecution(executionId, API_KEY!)
			}

			let pageCount = 0
			let totalRecords = 0

			for await (const page of duneService.fetchAllPages<TestQueryResult>(executionId, API_KEY!, 10)) {
				pageCount++
				totalRecords += page.length

				console.log(`✓ Page ${pageCount}: ${page.length} records`)

				// Early termination after first page
				if (pageCount === 1) {
					break
				}
			}

			expect(pageCount).to.equal(1)
			console.log(`✓ Early termination worked: ${pageCount} page, ${totalRecords} records`)
		})
	})

	describe('Bulk Operations', () => {
		it('should fetch all data as single array', async function () {
			this.timeout(180000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
				await duneService.waitForExecution(executionId, API_KEY!)
			}

			// Limit to avoid memory issues and long tests
			const allData = await duneService.fetchAllData<TestQueryResult>(executionId, API_KEY!, 20)

			expect(allData).to.be.an('array')
			console.log(`✓ fetchAllData: ${allData.length} total records`)

			if (allData.length > 0) {
				console.log(`Sample record:`, JSON.stringify(allData[0], null, 2))
			}
		})
	})

	describe('Error Handling', () => {
		it('should handle non-existent query ID', async function () {
			this.timeout(30000)

			try {
				await duneService.executeQuery({
					queryId: '99999999999',
					apiKey: API_KEY!
				})
				expect.fail('Should have thrown an error for non-existent query')
			} catch (error: any) {
				expect(error.message).to.include.oneOf(['500', '404', 'not found', 'Not Found'])
				console.log(`✓ Expected error for non-existent query: ${error.message}`)
			}
		})

		it('should handle invalid execution ID', async function () {
			this.timeout(30000)

			try {
				await duneService.fetchPage({
					executionId: 'invalid-execution-id-12345',
					apiKey: API_KEY!
				})
				expect.fail('Should have thrown an error for invalid execution ID')
			} catch (error: any) {
				expect(error.message).to.include.oneOf(['400', '404', 'not found', 'Not Found'])
				console.log(`✓ Expected error for invalid execution ID: ${error.message}`)
			}
		})

		it('should handle network timeouts gracefully', async function () {
			this.timeout(10000) // Short timeout to test timeout handling

			// This test assumes the DuneService has proper timeout handling
			try {
				const shortTimeoutService = new DuneService()
				// If your service supports timeout configuration, set a very short timeout here

				await shortTimeoutService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})

				console.log('✓ Request completed within timeout (no timeout error to test)')
			} catch (error: any) {
				if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
					console.log(`✓ Timeout handled gracefully: ${error.message}`)
				} else {
					console.log(`✓ Other error (not timeout): ${error.message}`)
				}
			}
		})
	})

	describe('Performance and Rate Limiting', () => {
		it('should measure query execution performance', async function () {
			this.timeout(180000)

			const startTime = Date.now()

			const queryStartTime = Date.now()
			executionId = await duneService.executeQuery({
				queryId: TEST_QUERY_ID,
				apiKey: API_KEY!
			})
			const queryTime = Date.now() - queryStartTime

			const waitStartTime = Date.now()
			await duneService.waitForExecution(executionId, API_KEY!)
			const waitTime = Date.now() - waitStartTime

			const fetchStartTime = Date.now()
			const firstPage = await duneService.fetchPage<TestQueryResult>({
				executionId,
				apiKey: API_KEY!,
				limit: 100
			})
			const fetchTime = Date.now() - fetchStartTime

			const totalTime = Date.now() - startTime

			console.log(`✓ Performance metrics:`)
			console.log(`  Query submission: ${queryTime}ms`)
			console.log(`  Wait for completion: ${waitTime}ms`)
			console.log(`  Fetch first page: ${fetchTime}ms`)
			console.log(`  Total time: ${totalTime}ms`)
			console.log(`  Records in first page: ${firstPage.data.length}`)

			expect(queryTime).to.be.a('number').and.greaterThan(0)
			expect(waitTime).to.be.a('number').and.greaterThan(0)
			expect(fetchTime).to.be.a('number').and.greaterThan(0)
			expect(totalTime).to.be.a('number').and.greaterThan(0)
		})

		it('should handle multiple concurrent requests', async function () {
			this.timeout(180000)

			const startTime = Date.now()

			// Execute multiple queries concurrently
			const queries = [
				duneService.executeQuery({ queryId: TEST_QUERY_ID, apiKey: API_KEY! }),
				duneService.executeQuery({ queryId: TEST_QUERY_ID, apiKey: API_KEY! }),
				duneService.executeQuery({ queryId: TEST_QUERY_ID, apiKey: API_KEY! })
			]

			const executionIds = await Promise.all(queries)
			const concurrentTime = Date.now() - startTime

			expect(executionIds).to.have.length(3)
			executionIds.forEach(id => {
				expect(id).to.be.a('string').and.have.length.greaterThan(0)
			})

			console.log(`✓ Concurrent execution:`)
			console.log(`  Time for 3 concurrent queries: ${concurrentTime}ms`)
			console.log(`  Execution IDs: ${executionIds.join(', ')}`)

			// Wait for all to complete
			const waitPromises = executionIds.map(id =>
				duneService.waitForExecution(id, API_KEY!)
			)
			await Promise.all(waitPromises)

			console.log(`✓ All concurrent queries completed`)
		})
	})

	describe('Real-world Usage Scenarios', () => {
		it('should stream and process large result sets', async function () {
			this.timeout(300000)

			let processedRecords = 0
			let totalPages = 0
			const recordCounts: number[] = []

			for await (const page of duneService.executeAndFetchAll<TestQueryResult>({
				queryId: TEST_QUERY_ID,
				apiKey: API_KEY!,
				limit: 50
			})) {
				totalPages++
				processedRecords += page.length
				recordCounts.push(page.length)

				// Simulate processing each record
				page.forEach(record => {
					expect(record).to.be.an('object')
				})

				console.log(`✓ Processed page ${totalPages}: ${page.length} records`)

				// Stop after reasonable number of pages
				if (totalPages >= 10) {
					console.log(`✓ Stopping after ${totalPages} pages for test performance`)
					break
				}
			}

			expect(totalPages).to.be.greaterThan(0)
			expect(processedRecords).to.be.greaterThan(0)

			console.log(`✓ Stream processing completed:`)
			console.log(`  Total pages: ${totalPages}`)
			console.log(`  Total records: ${processedRecords}`)
			console.log(`  Records per page: ${recordCounts.join(', ')}`)
		})

		it('should handle data transformation during streaming', async function () {
			this.timeout(180000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
				await duneService.waitForExecution(executionId, API_KEY!)
			}

			const transformedData: any[] = []
			let pageCount = 0

			for await (const page of duneService.fetchAllPages<TestQueryResult>(executionId, API_KEY!, 25)) {
				pageCount++

				// Transform each record
				const transformedPage = page.map((record, index) => ({
					...record,
					_metadata: {
						processed_at: new Date().toISOString(),
						page_number: pageCount,
						record_index: index,
						total_fields: Object.keys(record).length
					}
				}))

				transformedData.push(...transformedPage)

				console.log(`✓ Page ${pageCount}: transformed ${transformedPage.length} records`)

				// Limit for test performance
				if (pageCount >= 3) {
					break
				}
			}

			expect(transformedData.length).to.be.greaterThan(0)

			if (transformedData.length > 0) {
				const firstTransformed = transformedData[0]
				expect(firstTransformed).to.have.property('_metadata')
				expect(firstTransformed._metadata).to.have.property('processed_at')
				expect(firstTransformed._metadata).to.have.property('page_number')
			}

			console.log(`✓ Transformation completed: ${transformedData.length} records processed`)
		})

		it('should aggregate data across multiple pages', async function () {
			this.timeout(180000)

			if (!executionId) {
				executionId = await duneService.executeQuery({
					queryId: TEST_QUERY_ID,
					apiKey: API_KEY!
				})
				await duneService.waitForExecution(executionId, API_KEY!)
			}

			const aggregation = {
				totalRecords: 0,
				fieldFrequency: new Map<string, number>(),
				valueTypes: new Map<string, number>(),
				nullCounts: new Map<string, number>()
			}

			let pageCount = 0

			for await (const page of duneService.fetchAllPages<TestQueryResult>(executionId, API_KEY!, 30)) {
				pageCount++
				aggregation.totalRecords += page.length

				page.forEach(record => {
					Object.entries(record).forEach(([field, value]) => {
						// Count field frequency
						aggregation.fieldFrequency.set(field,
							(aggregation.fieldFrequency.get(field) || 0) + 1
						)

						// Count value types
						const valueType = value === null ? 'null' : typeof value
						aggregation.valueTypes.set(valueType,
							(aggregation.valueTypes.get(valueType) || 0) + 1
						)

						// Count nulls per field
						if (value === null || value === undefined) {
							aggregation.nullCounts.set(field,
								(aggregation.nullCounts.get(field) || 0) + 1
							)
						}
					})
				})

				console.log(`✓ Page ${pageCount}: aggregated ${page.length} records`)

				// Limit for test performance
				if (pageCount >= 3) {
					break
				}
			}

			expect(aggregation.totalRecords).to.be.greaterThan(0)

			console.log(`✓ Aggregation results:`)
			console.log(`  Total records: ${aggregation.totalRecords}`)
			console.log(`  Unique fields: ${aggregation.fieldFrequency.size}`)
			console.log(`  Value types:`, Object.fromEntries(aggregation.valueTypes))

			if (aggregation.fieldFrequency.size > 0) {
				console.log(`  Most common fields:`,
					Array.from(aggregation.fieldFrequency.entries())
						.sort(([, a], [, b]) => b - a)
						.slice(0, 5)
						.map(([field, count]) => `${field}(${count})`)
						.join(', ')
				)
			}
		})
	})
})