import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS susde_rates;
      CREATE TABLE susde_rates
      (
          hr   				 TIMESTAMP,
          rate				 DECIMAL
      );
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS susde_rates;
	`)
}
