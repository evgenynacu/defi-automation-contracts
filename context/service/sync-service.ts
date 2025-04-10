import { Pool } from "pg"
import { DataRequest, DataService } from "./data-service"

export class SyncService {
	constructor(
		private readonly pool: Pool,
		private readonly dataService: DataService,
	) {
	}

	async syncData(request: DataRequest): Promise<void> {
		const { id, ...data } = await this.dataService.getData(request)
		await this.pool.query(`INSERT INTO data (job_id, data) VALUES ($1, $2)`, [id, data])
	}
}