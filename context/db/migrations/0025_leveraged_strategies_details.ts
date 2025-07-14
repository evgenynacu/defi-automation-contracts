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
          yield_rate									DECIMAL,
          borrow_rate									DECIMAL,
          yield_protocol							VARCHAR,
	        yield_description						VARCHAR,
          lending_protocol						VARCHAR,
          lending_description					VARCHAR,
		      lending_id									VARCHAR,
		      max_ltv											DECIMAL,
		      supply											DECIMAL,
          borrow											DECIMAL,
          liquidity										DECIMAL,
          utilization									DECIMAL,
		      base_currency								VARCHAR
      );
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS leveraged_strategies_details;
	`)
}
