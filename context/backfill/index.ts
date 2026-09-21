import dotenv from "dotenv"
dotenv.config()

import { Pool } from "pg"
import { ethers } from "ethers"
import { getMorphoBorrowRate } from "../../common/get-morpho-borrow-rate"
import { getPoolLiquidity } from "../../common/get-pool-liquidity"
import { poolLiquidityJobId } from "../service/data-service"
import { SUSDS_USDT_ROUTE_POOLS } from "../route-pools"
import { runMigrations } from "../db/run-migrations"

/**
 * Rebuilds history for metrics that only started being collected when they were deployed.
 *
 * Prometheus cannot help here: remote-write rejects backdated samples, so a gauge's history begins at
 * its first scrape and no amount of waiting recovers what came before. Both of these metrics are pure
 * state reads though, so an archive node can answer what they were at any past block — the borrow rate
 * because the IRM prices the market from on-chain state, and pool depth because it is a balance.
 *
 * Rows go into the same `data` table the live sync writes to, under the same job ids, so the
 * reconstruction and the ongoing collection form one continuous series.
 *
 * Re-runnable: rows this script wrote before are removed for the window being rebuilt, and rows the
 * live sync collected are left alone.
 */

const MARKET_ID = "0x3274643db77a064abd3bc851de77556a4ad2e2f502f4f0c80845fa8f909ecf0b" as const

const DAYS = Number(process.env.BACKFILL_DAYS ?? 30)
const INTERVAL_HOURS = Number(process.env.BACKFILL_INTERVAL_HOURS ?? 4)
// Ethereum targets 12s slots. Only used to guess a block to look at — the sample is then stamped with
// that block's real timestamp, so a drifting estimate shifts which block is read, never when it is
// recorded, and the series cannot skew over a long window.
const SECONDS_PER_BLOCK = 12
// Concurrency across samples. Each sample is a burst of reads, so this is deliberately low: the point
// is to finish without tripping the provider's rate limit, not to finish fastest.
const CONCURRENCY = Number(process.env.BACKFILL_CONCURRENCY ?? 3)

type Row = { jobId: string, at: Date, data: Record<string, unknown> }

async function sampleAt(runner: ethers.JsonRpcProvider, blockNumber: number): Promise<Row[]> {
	const block = await runner.getBlock(blockNumber)
	if (block === null) {
		throw new Error(`block ${blockNumber} not found`)
	}
	const at = new Date(block.timestamp * 1000)

	const { id, ...rate } = await getMorphoBorrowRate(runner, MARKET_ID, blockNumber)
	const rows: Row[] = [{ jobId: id, at, data: { ...rate, backfill: true } }]

	for (const pool of SUSDS_USDT_ROUTE_POOLS) {
		rows.push({
			jobId: poolLiquidityJobId(pool.venue, pool.source),
			at,
			data: { result: await getPoolLiquidity(runner, pool.source, blockNumber), backfill: true },
		})
	}
	return rows
}

/** Runs tasks with a bounded number in flight, preserving input order in the result. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
	const results = new Array<R>(items.length)
	let next = 0
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (next < items.length) {
				const index = next++
				results[index] = await fn(items[index], index)
			}
		}),
	)
	return results
}

async function main() {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error("DATABASE_URL is required")
	}
	const rpcUrl = process.env.ETHEREUM_RPC_URL
	if (!rpcUrl) {
		throw new Error("ETHEREUM_RPC_URL is required, and it must be an archive node")
	}

	const runner = new ethers.JsonRpcProvider(rpcUrl)
	const pool = new Pool({ connectionString })
	await runMigrations(connectionString)

	const head = await runner.getBlockNumber()
	const step = Math.round(INTERVAL_HOURS * 3600 / SECONDS_PER_BLOCK)
	const count = Math.floor(DAYS * 24 / INTERVAL_HOURS)
	const blocks = Array.from({ length: count }, (_, i) => head - (count - 1 - i) * step).filter(b => b > 0)

	console.log(`Backfilling ${DAYS}d at ${INTERVAL_HOURS}h resolution: ${blocks.length} samples, blocks ${blocks[0]}..${head}`)

	// Fail before touching the database if the node cannot serve the oldest block.
	try {
		await getPoolLiquidity(runner, SUSDS_USDT_ROUTE_POOLS[0].source, blocks[0])
	} catch (e) {
		throw new Error(
			`Cannot read state at block ${blocks[0]} — ETHEREUM_RPC_URL is not an archive node, or does ` +
			`not retain ${DAYS} days. Lower BACKFILL_DAYS or point at an archive endpoint. (${e})`,
		)
	}

	let done = 0
	const sampled = await mapWithConcurrency(blocks, CONCURRENCY, async block => {
		try {
			const rows = await sampleAt(runner, block)
			if (++done % 10 === 0 || done === blocks.length) {
				console.log(`  ${done}/${blocks.length} samples`)
			}
			return rows
		} catch (e) {
			// One unreadable block should not abandon the rest of the window.
			console.error(`  block ${block} failed:`, e instanceof Error ? e.message : e)
			return []
		}
	})

	const rows = sampled.flat()
	if (rows.length === 0) {
		console.log("Nothing to write")
		await pool.end()
		return
	}

	const jobIds = [...new Set(rows.map(r => r.jobId))]
	const from = new Date(Math.min(...rows.map(r => r.at.getTime())))
	const to = new Date(Math.max(...rows.map(r => r.at.getTime())))

	const client = await pool.connect()
	try {
		await client.query("BEGIN")
		// Only ever removes this script's own output. Rows the cron collected have no backfill marker,
		// so a re-run cannot destroy real observations that overlap the window.
		const cleared = await client.query(
			`DELETE FROM data
			 WHERE job_id = ANY($1) AND updated_at BETWEEN $2 AND $3 AND (data ->> 'backfill') = 'true'`,
			[jobIds, from, to],
		)
		for (const row of rows) {
			await client.query(
				`INSERT INTO data (updated_at, job_id, data) VALUES ($1, $2, $3)`,
				[row.at, row.jobId, row.data],
			)
		}
		await client.query("COMMIT")
		console.log(`Replaced ${cleared.rowCount} previously backfilled row(s), inserted ${rows.length} across ${jobIds.length} job(s)`)
		console.log(`Range: ${from.toISOString()} .. ${to.toISOString()}`)
	} catch (e) {
		await client.query("ROLLBACK")
		throw e
	} finally {
		client.release()
	}

	await pool.end()
}

main().then(() => process.exit(0)).catch(e => {
	console.error(e)
	process.exit(1)
})
