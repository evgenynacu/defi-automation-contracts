import { Pool } from "pg"

export async function exportLatestData(pool: Pool) {
	const res = await pool.query(`SELECT job_id, updated_at, data FROM data where updated_at > current_timestamp - interval '1 minute'`)
	res.rows.forEach(row => console.log(row))
}