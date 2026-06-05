import { Client } from "pg"

type RefreshOutcome = {
	view: string
	ok: boolean
	durationMs: number
	skipped?: boolean
	error?: string
}

async function refreshOne(connectionString: string, view: string): Promise<RefreshOutcome> {
	const start = Date.now()
	const client = new Client({ connectionString })
	await client.connect()
	try {
		await client.query("BEGIN")
		await client.query("SET LOCAL work_mem = '8MB'")
		await client.query("SET LOCAL hash_mem_multiplier = 1.0")
		await client.query("SET LOCAL max_parallel_workers_per_gather = 0")
		await client.query("SET LOCAL maintenance_work_mem = '64MB'")
		await client.query("SET LOCAL max_parallel_maintenance_workers = 0")
		await client.query(`REFRESH MATERIALIZED VIEW ${view}`)
		await client.query("COMMIT")
		return { view, ok: true, durationMs: Date.now() - start }
	} catch (e) {
		try { await client.query("ROLLBACK") } catch {}
		const msg = e instanceof Error ? e.message : String(e)
		console.error(`Failed to refresh ${view}:`, e)
		return { view, ok: false, durationMs: Date.now() - start, error: msg }
	} finally {
		await client.end().catch(e => console.error(`Failed to end refresh client for ${view}:`, e))
	}
}

let inFlight: Promise<RefreshOutcome[]> | null = null

export function refreshViews(connectionString: string): Promise<RefreshOutcome[]> {
	if (inFlight) {
		console.log(`refreshViews already in flight, joining existing run`)
		return inFlight
	}
	inFlight = doRefreshViews(connectionString).finally(() => { inFlight = null })
	return inFlight
}

// Stable arbitrary 64-bit constant — must be the same across server/cron processes.
const REFRESH_VIEWS_LOCK_KEY = "7264683939393939"

async function doRefreshViews(connectionString: string): Promise<RefreshOutcome[]> {
	const runId = `refresh-${Date.now()}`
	const startedAt = Date.now()
	console.log(`[${runId}] refreshViews started`)

	const lockClient = new Client({ connectionString })
	await lockClient.connect()
	try {
		const r = await lockClient.query<{ got: boolean }>(
			"SELECT pg_try_advisory_lock($1::bigint) AS got",
			[REFRESH_VIEWS_LOCK_KEY],
		)
		if (!r.rows[0].got) {
			console.warn(`[${runId}] refreshViews skipped — another process holds the advisory lock`)
			await lockClient.end().catch(() => {})
			return [{ view: "*", ok: false, skipped: true, durationMs: Date.now() - startedAt, error: "another refresh in progress" }]
		}
	} catch (e) {
		await lockClient.end().catch(() => {})
		console.error(`[${runId}] Failed to acquire advisory lock:`, e)
		throw e
	}

	const results: RefreshOutcome[] = []
	try {
		const day = await refreshOne(connectionString, "main_data_day")
		console.log(`[${runId}] Refreshed main_data_day in ${day.durationMs} ms (ok=${day.ok})`)
		results.push(day)

		if (day.ok) {
			const week = await refreshOne(connectionString, "main_data_week")
			console.log(`[${runId}] Refreshed main_data_week in ${week.durationMs} ms (ok=${week.ok})`)
			results.push(week)
		} else {
			console.warn(`[${runId}] Skipping main_data_week refresh because main_data_day failed`)
			results.push({ view: "main_data_week", ok: false, durationMs: 0, skipped: true })
		}

		const pos = await refreshOne(connectionString, "position_values_ext_mat")
		console.log(`[${runId}] Refreshed position_values_ext_mat in ${pos.durationMs} ms (ok=${pos.ok})`)
		results.push(pos)

		const totalMs = Date.now() - startedAt
		const failed = results.filter(r => !r.ok && !r.skipped).map(r => r.view)
		const skipped = results.filter(r => r.skipped).map(r => r.view)
		if (failed.length === 0 && skipped.length === 0) {
			console.log(`[${runId}] refreshViews finished OK in ${totalMs} ms`)
		} else {
			console.warn(`[${runId}] refreshViews finished in ${totalMs} ms — failed: [${failed.join(", ")}] skipped: [${skipped.join(", ")}]`)
		}

		return results
	} catch (e) {
		const totalMs = Date.now() - startedAt
		console.error(`[${runId}] refreshViews threw after ${totalMs} ms:`, e)
		throw e
	} finally {
		try {
			await lockClient.query("SELECT pg_advisory_unlock($1::bigint)", [REFRESH_VIEWS_LOCK_KEY])
		} catch (e) {
			console.error(`[${runId}] Failed to release advisory lock:`, e)
		} finally {
			await lockClient.end().catch(e => console.error(`[${runId}] Failed to end lock client:`, e))
		}
	}
}
