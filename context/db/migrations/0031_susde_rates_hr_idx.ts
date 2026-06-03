import { MigrationBuilder } from 'node-pg-migrate'

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
		CREATE INDEX IF NOT EXISTS susde_rates_hr_idx ON susde_rates (hr);
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
		DROP INDEX IF EXISTS susde_rates_hr_idx;
	`)
}
