import { MigrationBuilder } from 'node-pg-migrate'

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
		CREATE INDEX IF NOT EXISTS data_updated_at_brin
			ON data USING BRIN (updated_at) WITH (pages_per_range = 32);

		CREATE INDEX IF NOT EXISTS data_job_id_updated_at
			ON data (job_id, updated_at);

		DROP INDEX IF EXISTS data_job_id_idx;
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
		CREATE INDEX IF NOT EXISTS data_job_id_idx ON data (job_id);
		DROP INDEX IF EXISTS data_job_id_updated_at;
		DROP INDEX IF EXISTS data_updated_at_brin;
	`)
}
