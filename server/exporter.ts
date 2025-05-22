import { Pool } from "pg"
import { openPositionSizeGauge } from "./metrics"
import { marketIds } from "../context/morpho"
import { wallets } from "../context/wallets"

export async function exportLatestData(pool: Pool) {
	const res = await pool.query<DataResultRow>(
		`SELECT job_id, updated_at, data
     FROM data
     where updated_at > current_timestamp - interval '1 minute'`
	)
	res.rows.forEach(row => {
		const info = parseJobId(row.job_id)
		if (info !== undefined) {
			openPositionSizeGauge.set(
				{
					wallet: info.wallet,
					position_id: info.positionId
				},
				row.data.result
			)
		}
	})
}

function parseJobId(jobId: string): { wallet: string, positionId: string } | undefined {
	if (jobId.startsWith("morpho-withdraw")) {
		const parts = jobId.split("-")
		const wallet = parts[2]
		const positionId = parts[3]
		return {
			wallet: wallets[wallet] || wallet,
			positionId: marketIds[positionId] || positionId,
		}
	}
	return undefined
}

type DataResultRow = {
	job_id: string
	updated_at: Date
	data: {
		result: number
	}
}