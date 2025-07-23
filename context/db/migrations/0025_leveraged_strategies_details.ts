import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS leveraged_strategies_details;
      CREATE TABLE leveraged_strategies_details
      (
          ts_day											TIMESTAMP,
          collateral_token						VARCHAR,
          debt_token									VARCHAR,
          daily_yield_rate						DECIMAL,
          daily_borrow_rate						DECIMAL,
          yield_protocol							VARCHAR,
          lending_protocol						VARCHAR,
          lending_description					VARCHAR,
		      lending_id									VARCHAR,
		      max_ltv											DECIMAL,
		      supply											DECIMAL,
          borrow											DECIMAL,
          liquidity										DECIMAL,
          utilization									DECIMAL,
		      base_currency								VARCHAR,
		      open_rate										DECIMAL,
          close_rate									DECIMAL,
		      expiry_rate									TIMESTAMP,
		      implied_daily_rate					DECIMAL
      );
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS leveraged_strategies_details;
	`)
}
