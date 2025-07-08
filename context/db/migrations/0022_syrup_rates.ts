import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS syrup_rates;
      CREATE TABLE syrup_rates
      (
          hr   				 TIMESTAMP,
          rate				 DECIMAL
      );
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS syrup_rates;
	`)
}
