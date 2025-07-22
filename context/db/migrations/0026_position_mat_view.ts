import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP MATERIALIZED VIEW IF EXISTS position_values_ext_mat;
			CREATE MATERIALIZED VIEW position_values_ext_mat AS
			select * from position_values_ext;

			CREATE INDEX IF NOT EXISTS position_values_ext_mat_job_id ON position_values_ext_mat (job_id);
			CREATE INDEX IF NOT EXISTS main_data_week_job_id ON main_data_week (job_id);
			CREATE INDEX IF NOT EXISTS main_data_day_job_id ON main_data_day (job_id);
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
			DROP MATERIALIZED VIEW IF EXISTS position_values_ext_mat;
	`)
}
