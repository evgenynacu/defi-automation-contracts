import {DuneSyncService} from "./dune-sync-service";
import {DuneService} from "./dune-service";
import dotenv from "dotenv";
import {Pool} from "pg";
import {sleep} from "../../common/sleep";

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

async function syncwstETH() {
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

async function syncweETH() {
	const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres"
	console.log("Connecting to " + connectionString)
	const connectionPool = new Pool({ connectionString })

	const dune = new DuneService()
	const service = new DuneSyncService(connectionPool, dune)

	await service.syncQueryToPostgres({
		queryId: "5873260",
		apiKey: process.env.DUNE_API_KEY!,
		pageSize: 20000,
		tableName: "weeth_rates",
		truncateBeforeInsert: true,
		doNotExecute: false,
	})
}


async function sync() {
	await syncUSDe()
	console.log("sync USDe completed")
	// await sleep(5000)
	// await syncwstETH()
	// console.log("sync wstETH completed")
	// await sleep(5000)
	// await syncweETH()
	// console.log("sync weETH completed")
}


sync().then()