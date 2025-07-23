import { Pool } from 'pg'
import { Strategy, StrategyDetails } from '../../types'

interface DBStrategy {
	yield_description: string;
	strategy_apr: number;
	ma7_strategy_apr: number;
	ma30_strategy_apr: number;
	implied_apr_7: number;
	implied_apr_30: number;
	days_left: number;
	implied_rate: number;
	max_ltv: number;
	utilization: number;
	supply: number;
	debt_token: string;
	lending_description: string;
	last_updated: Date;
	lending_id: string;
}

interface DBStrategyDetails {
	ts_day: Date;
	borrow_rate: number;
	yield_rate: number;
	ma30_strategy_apr: number;
	ma7_strategy_apr: number;
	ma1_strategy_apr: number;
	ma30_yield_rate: number;
	ma7_yield_rate: number;
	ma30_borrow_rate: number;
	ma7_borrow_rate: number;
}

export class StrategyService {
	private pool: Pool

	constructor(pool: Pool) {
		this.pool = pool
	}

	async getStrategyDetails(strategyId: string, ltv: number) {
		try {
			const result = await this.pool.query({
					text: `
              select ts_day,
                     daily_borrow_rate * 365                                                                                                                                                 as borrow_rate,
                     daily_yield_rate * 365                                                                                                                                                  as yield_rate,
                     365 * AVG((daily_yield_rate - $1 * daily_borrow_rate) / (1 - $1))
                           OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as ma30_strategy_apr,
                     365 * AVG((daily_yield_rate - $1 * daily_borrow_rate) / (1 - $1))
                           OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  as ma7_strategy_apr,
                     365 * (daily_yield_rate - $1 * daily_borrow_rate) / (1 - $1)                                                                                                            as ma1_strategy_apr,
                     365 * AVG(daily_yield_rate)
                     OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)       as ma30_yield_rate,
                     365 * AVG(daily_yield_rate)
                     OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)        as ma7_yield_rate,
                     365 * AVG(daily_borrow_rate)
                     OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)       as ma30_borrow_rate,
                     365 * AVG(daily_borrow_rate)
                     OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)        as ma7_borrow_rate
              from leveraged_strategies_details
              where lending_id = $2;
					`,
					values: [ltv, strategyId],
				}
			)
			return result.rows.map(row => mapDbToStrategyDetails(row))
		} catch (error) {
			console.error('Error fetching strategy details:', error)
			throw error
		}
	}

	async getAllStrategies(): Promise<Strategy[]> {
		try {
			const result = await this.pool.query<DBStrategy>(
				'SELECT * FROM leveraged_strategies_view ORDER BY implied_apr_30 DESC'
			)

			return result.rows.map(row => mapDBtoStrategy(row))
		} catch (error) {
			console.error('Error fetching strategies:', error)
			throw error
		}
	}

	async getStrategyById(id: string): Promise<Strategy | null> {
		try {
			const query = `
          SELECT *
          FROM leveraged_strategies_view
          WHERE lending_id = $1
			`
			const result = await this.pool.query<DBStrategy>(query, [id])

			if (result.rows.length === 0) {
				return null
			}

			return mapDBtoStrategy(result.rows[0])
		} catch (error) {
			console.error(`Error fetching strategy by ID ${id}:`, error)
			throw error
		}
	}
}

function mapDbToStrategyDetails(db: DBStrategyDetails): StrategyDetails {
	return {
		day: db.ts_day,
		borrowRate1d: db.borrow_rate,
		borrowRate7d: db.ma7_borrow_rate,
		borrowRate30d: db.ma30_borrow_rate,
		yieldRate1d: db.yield_rate,
		yieldRate7d: db.ma7_yield_rate,
		yieldRate30d: db.ma30_yield_rate,
		apr1d: db.ma1_strategy_apr,
		apr7d: db.ma7_strategy_apr,
		apr30d: db.ma30_strategy_apr,
	}
}

function mapDBtoStrategy(db: DBStrategy): Strategy {
	return {
		id: db.lending_id,
		name: db.yield_description,
		apr30d: Number(db.ma30_strategy_apr),
		apr7d: Number(db.ma7_strategy_apr),
		apr1d: Number(db.strategy_apr),
		impliedApr7d: Number(db.implied_apr_7),
		impliedApr30d: Number(db.implied_apr_30),
		daysLeft: Number(db.days_left),
		impliedRate: Number(db.implied_rate),
		lltv: Number(db.max_ltv),
		utilization: Number(db.utilization),
		totalSupply: Number(db.supply),
		debtToken: db.debt_token,
		description: db.lending_description,
		lastUpdated: db.last_updated
	}
}
