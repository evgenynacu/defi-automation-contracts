import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
  const ltv = 0.8
	pgm.sql(`
			DROP VIEW IF exists leveraged_strategies_view;
      create or replace view leveraged_strategies_view as
      with raw_data as (select *
                        from leveraged_strategies_details),
           data as (select collateral_token_symbol                                                                                                                                           as yield_description,
                           (daily_yield_rate - ${ltv} * daily_borrow_rate) / (1 - ${ltv})                                                                                                    as daily_strategy_apr,
                           AVG((daily_yield_rate - ${ltv} * daily_borrow_rate) / (1 - ${ltv}))
                           OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  as ma7_daily_strategy_apr,
                           AVG((daily_yield_rate - ${ltv} * daily_borrow_rate) / (1 - ${ltv}))
                           OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as ma30_daily_strategy_apr,
                           AVG(daily_borrow_rate)
                           OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  as ma7_daily_borrow_rate,
                           AVG(daily_borrow_rate)
                           OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day ROWS BETWEEN 30 PRECEDING AND CURRENT ROW) as ma30_daily_borrow_rate,
                           max_ltv,
                           utilization,
                           supply,
                           debt_token_symbol                                                                                                                                                 as debt_token,
                           lending_description,
                           ts_day                                                                                                                                                               last_updated,
                           lending_id,
                           expiry,
                           implied_daily_rate,
                           row_number()
                           OVER (PARTITION BY yield_protocol, lending_protocol, lending_description, collateral_token, debt_token ORDER BY ts_day desc)                                      as rn
                    from raw_data d
                    where (supply > 100000 or lending_protocol = 'aave' or base_currency = 'ETH'))
      select yield_description,
             daily_strategy_apr * 365                                                    as strategy_apr,
             ma7_daily_strategy_apr * 365                                                as ma7_strategy_apr,
             ma30_daily_strategy_apr * 365                                               as ma30_strategy_apr,
             365 * (implied_daily_rate - ${ltv} * ma7_daily_borrow_rate) / (1 - ${ltv})  as implied_apr_7,
             365 * (implied_daily_rate - ${ltv} * ma30_daily_borrow_rate) / (1 - ${ltv}) as implied_apr_30,
             extract(EPOCH from (expiry - now())) / 86400                                as days_left,
             implied_daily_rate * 365                                                    as implied_rate,
             max_ltv,
             utilization,
             supply,
             debt_token,
             lending_description,
             last_updated,
             lending_id
      from data
      where rn = 1
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
			DROP VIEW IF exists leveraged_strategies_view;
	`)
}
