import { describe, it } from 'mocha'
import { Pool } from "pg"

describe('time-arbitrage', () => {
	let pool: Pool

	before(async () => {
		pool = new Pool({
			connectionString: process.env.DATABASE_URL || "postgresql://postgres:mysecretpassword@localhost:5432/postgres",
		})
	})

	it("should calculate strategy results for sUSDe", async () => {
		const r = await pool.query<TestRow>(`
        with minutes as (SELECT generate_series(
                                        timestamp '2025-06-21 00:00:00',
                                        date_trunc('day', now()),
                                        INTERVAL '1 minute'
                                ) AS minute_ts),
             buy_rates as (select date_trunc('minute', updated_at)        as buy_date,
                                  (1 / cast(data -> 'result' as numeric)) as buy_rate
                           from data
                           where job_id = 'swap-rate-USDe-sUSDe'),
             sell_rates as (select date_trunc('minute', updated_at)  as sell_date,
                                   cast(data -> 'result' as numeric) as sell_rate
                            from data
                            where job_id = 'swap-rate-sUSDe-USDe'),
             data as (select minute_ts,
                             buy_rate,
                             sell_rate,
                             rate * ${rateMultiplier} as rate,
                             (rate * ${rateMultiplier}) / buy_rate - 1 as buy_threshold,
                             sell_rate / (rate * ${rateMultiplier}) - 1 as sell_threshold
                      from minutes
                               left join buy_rates on buy_date = minute_ts
                               left join sell_rates on sell_date = minute_ts
                               join susde_rates on hr = date_trunc('hour', minute_ts))
        select minute_ts,
               buy_threshold,
               sell_threshold,
               rate,
               buy_rate,
               sell_rate
        from data
        order by minute_ts
		`)

		let result = 1
		let lastBuyRate: number | undefined = undefined
		let finished = 0
		let maxBuyThreshold = 0
		let maxSellThreshold = 0

		for (const row of r.rows) {
			const ts = row.minute_ts
			const buyRate = Number(row.buy_rate)
			const sellRate = Number(row.sell_rate)
			const buyThreshold = Number(row.buy_threshold)
			const sellThreshold = Number(row.sell_threshold)

			if (buyThreshold > maxBuyThreshold) {
				maxBuyThreshold = buyThreshold
			}
			if (sellThreshold > maxSellThreshold) {
				maxSellThreshold = sellThreshold
			}

			if (lastBuyRate === undefined) {
				if (buyThreshold !== 0 && buyRate !== 0) {
					if (buyThreshold > minBuyThreshold) {
						console.log("buying at ", buyRate, "ts: ", ts)
						lastBuyRate = buyRate
					}
				}
			} else {
				if (sellThreshold !== 0 && sellRate !== 0) {
					if (sellThreshold > minSellThreshold) {
						console.log("selling at ", sellRate, "ts: ", ts)
						result *= sellRate / lastBuyRate
						lastBuyRate = undefined
						finished++
					}
				}
			}
		}

		console.log("steps: ", finished, "result: ", result, "maxBuyThreshold: ", maxBuyThreshold, "maxSellThreshold: ", maxSellThreshold)
	})
})

const rateMultiplier = 0.9983
const minBuyThreshold = 0.0001
const minSellThreshold = 0.0001

type TestRow = {
	minute_ts: Date
	buy_threshold: string
	sell_threshold: string
	buy_rate: string
	sell_rate: string
	rate: string
}
