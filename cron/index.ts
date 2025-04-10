import { createContext } from "../context"
import { runMigrations } from "../context/db/run-migrations"
import { logAsync } from "../common/log-async"

async function runJobs() {
	console.log("Starting cron jobs")

	const { connectionPool, syncService } = await createContext()
	await runMigrations(connectionPool)

	const cron = await import("node-cron")
	cron.schedule('* * * * *', () => {
		console.log("Running cron job")

		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1"
			})
		)
	})

	console.log("Initialized cron jobs")
}

runJobs().then()
