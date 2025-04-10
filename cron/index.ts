import { createContext } from "../context"
import { pool } from "../typechain-types/@uniswap/v3-core/contracts/interfaces"

async function runJobs() {
	console.log("Starting cron jobs")

	const { connectionPool } = await createContext()

	const cron = await import("node-cron")
	cron.schedule('*/5 * * * *', () => {
		console.log("Running cron job")
	});

	console.log("Initialized cron jobs")
}

runJobs().then()
