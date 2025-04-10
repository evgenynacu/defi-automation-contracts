import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      CREATE TABLE data
      (
          id         SERIAL PRIMARY KEY,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		      job_id     VARCHAR,
		      data       JSONB
      );

			CREATE INDEX data_job_id_idx ON data (job_id);
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS data;
	`)
}
