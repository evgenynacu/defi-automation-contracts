import { Pool } from "pg"
import { DataService } from "./service/data-service"
import { ethers } from "ethers"
import { SyncService } from "./service/sync-service"
import { DuneService } from "./service/dune-service"
import { DuneSyncService } from "./service/dune-sync-service"

export type Context = {
	connectionPool: Pool
	dataService: DataService
	syncService: SyncService
	duneService: DuneService
	duneSyncService: DuneSyncService
}

export async function createContext(): Promise<Context> {
	const connectionPool = new Pool({
		connectionString: process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres",
	})

	const runner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
	const dataService = new DataService(runner)
	const syncService = new SyncService(connectionPool, dataService)
	const duneService = new DuneService()
	const duneSyncService = new DuneSyncService(connectionPool, duneService)

	return {
		connectionPool,
		dataService,
		syncService,
		duneService,
		duneSyncService,
	}
}