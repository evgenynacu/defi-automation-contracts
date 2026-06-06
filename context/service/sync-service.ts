import { Pool } from "pg"
import { DataRequest, DataService } from "./data-service"
import { MetricPublisher } from "./metric-publisher"

export class SyncService {
	constructor(
		private readonly pool: Pool,
		private readonly dataService: DataService,
		private readonly metricPublisher: MetricPublisher,
	) {
	}

	async syncData(request: DataRequest): Promise<void> {
		const { id, ...data } = await this.dataService.getData(request)
		await this.pool.query(`INSERT INTO data (job_id, data) VALUES ($1, $2)`, [id, data])
		try {
			this.metricPublisher.publish(request, data as any)
		} catch (e) {
			console.error(`Failed to publish metric for ${id}:`, e)
		}
	}
}
