import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      alter table jobs drop column if exists maturity_date;
      alter table jobs add column maturity_date TIMESTAMP null;
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      alter table jobs drop column if exists maturity_date;
      DROP MATERIALIZED VIEW IF EXISTS main_data_week;
      DROP MATERIALIZED VIEW IF EXISTS main_data_day;
	`)
}
