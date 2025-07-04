import axios from 'axios'

export interface DuneQueryResult<T = any> {
	data: T[];
	pagination?: {
		next_offset?: string;
	};
	metadata?: any;
}

export interface DuneQueryOptions {
	queryId: string;
	params?: Record<string, any>;
	limit?: number;
	offset?: string;
	apiKey: string;
}

export interface DuneExecutionOptions {
	queryId: string;
	params?: Record<string, any>;
	apiKey: string;
}

export type DuneFetchOptions = DuneExecutionFetchOptions | DuneQueryFetchOptions

type DuneExecutionFetchOptions = {
	executionId: string;
	limit?: number;
	apiKey: string;
}

type DuneQueryFetchOptions = {
	queryId: string;
	limit?: number;
	apiKey: string;
}

export class DuneService {
	private readonly baseUrl = 'https://api.dune.com/api/v1'

	/**
	 * Executes a Dune query and returns execution ID
	 * @param options Execution parameters
	 * @returns Execution ID
	 */
	async executeQuery(options: DuneExecutionOptions): Promise<string> {
		const { queryId, params = {}, apiKey } = options

		try {
			const executeResponse = await axios.post(
				`${this.baseUrl}/query/${queryId}/execute`,
				{ query_parameters: params },
				{ headers: { 'x-dune-api-key': apiKey } }
			)

			return executeResponse.data.execution_id
		} catch (error) {
			console.error('Error executing Dune query:', error)
			throw error
		}
	}

	/**
	 * Checks execution status
	 * @param executionId Execution ID
	 * @param apiKey API key
	 * @returns Execution status
	 */
	async getExecutionStatus(executionId: string, apiKey: string): Promise<string> {
		try {
			const statusResponse = await axios.get(
				`${this.baseUrl}/execution/${executionId}/status`,
				{ headers: { 'x-dune-api-key': apiKey } }
			)

			return statusResponse.data.state
		} catch (error) {
			console.error('Error getting execution status:', error)
			throw error
		}
	}

	/**
	 * Waits for query execution to complete
	 * @param executionId Execution ID
	 * @param apiKey API key
	 * @param pollInterval Polling interval in milliseconds (default: 1000)
	 * @returns Promise that resolves when execution is complete
	 */
	async waitForExecution(executionId: string, apiKey: string, pollInterval: number = 1000): Promise<void> {
		let status = 'QUERY_STATE_PENDING'

		while (status !== 'QUERY_STATE_COMPLETED') {
			status = await this.getExecutionStatus(executionId, apiKey)

			if (status !== 'QUERY_STATE_COMPLETED' && status !== 'QUERY_STATE_PENDING' && status !== 'QUERY_STATE_EXECUTING') {
				throw new Error(`Query execution failed for execution ID: ${executionId} status: ${status}`)
			}

			if (status !== 'QUERY_STATE_COMPLETED') {
				await new Promise(resolve => setTimeout(resolve, pollInterval))
			}
		}
	}

	/**
	 * Loads a single page of data from completed execution
	 * @param options Fetch parameters
	 * @returns Query result for one page
	 */
	async fetchPage<T = any>(options: DuneFetchOptions & { offset?: string }): Promise<DuneQueryResult<T>> {
		const { limit, offset, apiKey } = options

		try {
			const resultResponse = await axios.get(
				"executionId" in options
					? `${this.baseUrl}/execution/${options.executionId}/results`
					: `${this.baseUrl}/query/${options.queryId}/results`,
				{
					params: { limit, offset },
					headers: { 'x-dune-api-key': apiKey }
				}
			)

			return {
				data: resultResponse.data.result.rows,
				pagination: {
					next_offset: resultResponse.data.next_offset,
				},
				metadata: resultResponse.data.result.metadata
			}
		} catch (error) {
			console.error('Error fetching page from Dune:', error)
			throw error
		}
	}

	async* fetchAllPages<T = any>(options: DuneFetchOptions): AsyncGenerator<T[], void, unknown> {
		let currentOffset: string | undefined = undefined
		let hasMore = true

		while (hasMore) {
			const result: DuneQueryResult<T> = await this.fetchPage<T>({
				...options,
				offset: currentOffset,
			})

			yield result.data

			currentOffset = result.pagination?.next_offset
			hasMore = result.pagination?.next_offset !== undefined
		}
	}

	/**
	 * Convenience method: executes query, waits for completion, and returns AsyncGenerator
	 * @param options Query options
	 * @returns AsyncGenerator that yields pages of data
	 */
	async* executeAndFetchAll<T = any>(options: DuneQueryOptions): AsyncGenerator<T[], void, unknown> {
		// Execute query
		const executionId = await this.executeQuery({
			queryId: options.queryId,
			params: options.params,
			apiKey: options.apiKey
		})

		// Wait for completion
		await this.waitForExecution(executionId, options.apiKey)

		// Fetch all data using generator
		yield* this.fetchAllPages<T>({
			executionId,
			apiKey: options.apiKey,
			limit: options.limit,
		})
	}

	/**
	 * Loads all data as a single array (use with caution for large datasets)
	 * @param executionId Execution ID
	 * @param apiKey API key
	 * @param limit Page size (optional)
	 * @returns Promise with all data
	 */
	async fetchAllData<T = any>(executionId: string, apiKey: string, limit?: number): Promise<T[]> {
		const allData: T[] = []

		for await (const page of this.fetchAllPages<T>({ executionId, apiKey, limit })) {
			allData.push(...page)
		}

		return allData
	}
}