import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS leveraged_strategies;
      CREATE TABLE leveraged_strategies
      (
          yield_description						VARCHAR,
          strategy_apr								DECIMAL,
		      ma7_strategy_apr						DECIMAL,
		      ma30_strategy_apr						DECIMAL,
		      max_ltv											DECIMAL,
		      utilization									DECIMAL,
		      supply											DECIMAL,
		      debt_token									VARCHAR,
		      last_updated								TIMESTAMP,
		      lending_id									VARCHAR
      );
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS leverated_strategies;
	`)
}
