import { Pool } from "pg"
import { hfGauge, ltvGauge, openPositionSizeGauge, walletHFGauge } from "./metrics"
import { marketIds } from "../context/morpho"
import { wallets } from "../context/wallets"
import { aaveVaults } from "../context/aave"
import { tokens } from "../context/tokens"
import { address } from "../common/types"

export async function exportLatestData(pool: Pool) {
	const res = await pool.query<DataResultRow>(
		`with raw_data as (SELECT job_id, updated_at, data, row_number() over (partition by job_id order by updated_at desc) as rn FROM data where updated_at > current_timestamp - interval '2 minute') select * from raw_data where rn = 1`
	)
	res.rows.forEach(row => {
		const info = parseJobId(row.job_id)
		if (info !== undefined && !info.positionId.startsWith("aave-hf")) {
			openPositionSizeGauge.set(
				{
					wallet: info.wallet,
					position_id: info.positionId
				},
				row.data.result
			)
			if (row.data.ltv) {
				ltvGauge.set(
					{
						wallet: info.wallet,
						position_id: info.positionId
					},
					row.data.ltv
				)
			}
			if (row.data.hf) {
				hfGauge.set(
					{
						wallet: info.wallet,
						position_id: info.positionId
					},
					row.data.hf
				)
			}
		}
		if (info !== undefined && info.positionId.startsWith("aave-hf")) {
			walletHFGauge.set(
				{
					wallet: info.wallet
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
	if (jobId.startsWith("aave-withdraw")) {
		const parts = jobId.split("-")
		const vault = parts[2] as address
		const collateral = parts[3] as address
		const desc = aaveVaults.find(it => it.vault === vault)
		if (desc !== undefined) {
			return {
				wallet: wallets[desc.owner] || desc.owner,
				positionId: tokens[collateral] || collateral,
			}
		}
	}
	if (jobId.startsWith("aave-hf")) {
		const parts = jobId.split("-")
		const wallet = parts[2]
		return {
			wallet: wallets[wallet] || wallet,
			positionId: "aave-hf-" + wallet,
		}
	}
	return undefined
}

type DataResultRow = {
	job_id: string
	updated_at: Date
	data: {
		result: number
		ltv?: number
		hf?: number
	}
}