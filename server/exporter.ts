import {Pool} from "pg"
import {
	aaveFreeSupplyGauge,
	aaveHFGauge,
	compoundHFGauge,
	hfGauge,
	ltvGauge,
	openPositionSizeGauge,
	pendleImpliedRateGauge,
} from "./metrics"
import {marketIds} from "../context/morpho"
import {wallets} from "../context/wallets"
import {aaveVaults} from "../context/aave"
import {tokens} from "../context/tokens"
import {address, toAddress} from "../common/types"
import {eulerPositions} from "../context/euler";

export async function exportLatestData(pool: Pool) {
	const res = await pool.query<DataResultRow>(
		`with raw_data as (SELECT job_id,
                                  updated_at,
                                  data,
                                  row_number() over (partition by job_id order by updated_at desc) as rn
                           FROM data
                           where updated_at > current_timestamp - interval '2 minute')
        select *
        from raw_data
        where rn = 1`
	)
	res.rows.forEach(row => {
		const parsedId = parseJobId(row.job_id)
		if (parsedId !== undefined && parsedId.type === "position") {
			openPositionSizeGauge.set(
				{
					wallet: parsedId.wallet,
					position_id: parsedId.positionId
				},
				row.data.result
			)
			if (row.data.ltv) {
				ltvGauge.set(
					{
						wallet: parsedId.wallet,
						position_id: parsedId.positionId
					},
					row.data.ltv
				)
			}
			if (row.data.hf) {
				hfGauge.set(
					{
						wallet: parsedId.wallet,
						position_id: parsedId.positionId
					},
					row.data.hf
				)
			}
		}
		if (parsedId !== undefined && parsedId.type === "aave-hf") {
			aaveHFGauge.set(
				{
					wallet: parsedId.wallet
				},
				row.data.result
			)
		}
		if (parsedId !== undefined && parsedId.type === "compound-hf") {
			compoundHFGauge.set(
				{
					wallet: parsedId.wallet,
					comet: parsedId.comet
				},
				row.data.result
			)
		}
		if (parsedId !== undefined && parsedId.type === "aave-free-supply") {
			aaveFreeSupplyGauge.set({token: parsedId.token}, row.data.result)
		}
		if (parsedId !== undefined && parsedId.type === "pendle-implied-rate") {
			pendleImpliedRateGauge.set({token: parsedId.token}, row.data.result)
		}
	})
}

type ParsedJobId = {
	type: "position"
	wallet: string
	positionId: string
} | {
	type: "aave-hf"
	wallet: string
} | {
	type: "aave-free-supply"
	token: string
} | {
	type: "compound-hf"
	wallet: string
	comet: string
} | {
	type: "pendle-implied-rate"
	token: string
}

function parseJobId(jobId: string): ParsedJobId | undefined {
	if (jobId.startsWith("morpho-withdraw")) {
		const parts = jobId.split("-")
		const wallet = parts[2]
		const positionId = parts[3]
		return {
			type: "position",
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
				type: "position",
				wallet: wallets[desc.owner] || desc.owner,
				positionId: tokens[collateral] || collateral,
			}
		}
	}
	if (jobId.startsWith("euler-withdraw")) {
		const parts = jobId.split("-")
		const wallet = parts[2] as address
		const collateralVault = parts[3] as address
		const debtVault = parts[4] as address
		const pos = eulerPositions.find(it => it.collateralVault == collateralVault && it.debtVault == debtVault)
		if (pos !== undefined) {
			return {
				type: "position",
				wallet: wallets[wallet] || wallet,
				positionId: pos.collateral + "/" + pos.debt,
			}
		}
	}
	if (jobId.startsWith("aave-hf")) {
		const parts = jobId.split("-")
		const wallet = parts[2]
		return {
			type: "aave-hf",
			wallet: wallets[wallet] || wallet
		}
	}
	if (jobId.startsWith("compound-hf")) {
		const parts = jobId.split("-")
		const wallet = parts[2]
		return {
			type: "compound-hf",
			wallet: wallets[wallet] || wallet,
			comet: parts[3]
		}
	}
	if (jobId.startsWith("aave-free-supply")) {
		const parts = jobId.split("-")
		const token = toAddress(parts[3])
		return {
			type: "aave-free-supply",
			token: tokens[token] || token,
		}
	}
	if (jobId.startsWith("pendle-implied-rate")) {
		const parts = jobId.split("-")
		const a = toAddress(parts[3])
		return {
			type: "pendle-implied-rate",
			token: tokens[a] || a,
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