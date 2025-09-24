import {DuneSyncService} from "./dune-sync-service";
import {DuneService} from "./dune-service";
import dotenv from "dotenv";
import {Pool} from "pg";

dotenv.config()

async function syncUSDe() {
	const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
	console.log("Connecting to " + connectionString)
	const connectionPool = new Pool({ connectionString })

	const dune = new DuneService()
	const service = new DuneSyncService(connectionPool, dune)

	await service.syncQueryToPostgres({
		queryId: "5836121",
		apiKey: process.env.DUNE_API_KEY!,
		pageSize: 20000,
		tableName: "susde_rates",
		truncateBeforeInsert: true,
		doNotExecute: false,
	})
}

async function syncETH() {
	const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
	console.log("Connecting to " + connectionString)
	const connectionPool = new Pool({ connectionString })

	const dune = new DuneService()
	const service = new DuneSyncService(connectionPool, dune)

	await service.syncQueryToPostgres({
		queryId: "5837743",
		apiKey: process.env.DUNE_API_KEY!,
		pageSize: 20000,
		tableName: "wsteth_rates",
		truncateBeforeInsert: true,
		doNotExecute: false,
	})
}


syncETH().then()