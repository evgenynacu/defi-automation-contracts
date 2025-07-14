import { Pool } from "pg"
import { DataService } from "./service/data-service"
import { ethers } from "ethers"
import { SyncService } from "./service/sync-service"
import { DuneService } from "./service/dune-service"
import { DuneSyncService } from "./service/dune-sync-service"
import { StrategyService } from './service/strategy-service'

export type Context = {
	connectionPool: Pool
	dataService: DataService
	syncService: SyncService
	duneService: DuneService
	duneSyncService: DuneSyncService
	strategyService: StrategyService
}

export async function createContext(): Promise<Context> {
	const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
	console.log("Connecting to " + connectionString)
	const connectionPool = new Pool({ connectionString })

	const runner = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
	const dataService = new DataService(runner)
	const syncService = new SyncService(connectionPool, dataService)
	const duneService = new DuneService()
	const duneSyncService = new DuneSyncService(connectionPool, duneService)
	const strategyService = new StrategyService(connectionPool)

	return {
		connectionPool,
		dataService,
		syncService,
		duneService,
		duneSyncService,
		strategyService,
	}
}