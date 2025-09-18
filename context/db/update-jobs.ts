import { wallets } from "../wallets"
import { Pool } from "pg"
import { marketIds, marketMaturityDates } from "../morpho"
import {aaveVaults, eulerPositions} from "../aave"
import { tokens, tokenMaturityDates } from "../tokens"

export async function updateJobs(pool: Pool) {
	const jobs: { id: string, name: string, maturityDate?: Date }[] = []
	for (const wallet of Object.keys(wallets)) {
		for (const marketId of Object.keys(marketIds)) {
			const id = `morpho-withdraw-${wallet}-${marketId}`
			const name = `Morpho ${marketIds[marketId]} [${wallets[wallet]}]`
			const maturityDate = marketMaturityDates[marketId]
			jobs.push({ id, name, maturityDate })
			console.log("Registered job " + id + " = " + name + " " + maturityDate)
		}
	}

	for (const pos of eulerPositions) {
		const id = `euler-withdraw-${pos.owner}-${pos.collateralVault}-${pos.debtVault}`
		const name = `Euler ${pos.collateral}/${pos.debt} [${wallets[pos.owner]}]`
		const maturityDate = tokenMaturityDates[pos.collateral]
		jobs.push({ id, name, maturityDate })
		console.log("Registered job " + id + " = " + name + " " + maturityDate)
	}

	for(const vault of aaveVaults) {
		const id = `aave-withdraw-${vault.vault}-${vault.collateral}-${vault.debt}`
		const name = `Aave ${tokens[vault.collateral]}/${tokens[vault.debt]} [${wallets[vault.owner]}]`
		const maturityDate = tokenMaturityDates[vault.collateral]
		jobs.push({ id, name, maturityDate })
		console.log("Registered job " + id + " = " + name + " " + maturityDate)
	}

	const client = await pool.connect()
	try {
		for (const job of jobs) {
			await client.query("BEGIN")
			await client.query(
				`
          INSERT INTO jobs (id, name, maturity_date)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, maturity_date = EXCLUDED.maturity_date
			`,
				[job.id, job.name, job.maturityDate || null],
			)
		}
		await client.query("COMMIT")
	} catch(e) {
		await client.query("ROLLBACK")
	} finally {
		client.release()
	}
}