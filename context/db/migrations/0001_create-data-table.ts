import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      CREATE TABLE data
      (
          id         SERIAL PRIMARY KEY,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		      data       JSONB
      );
	`)
}

export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS data;
	`)
}
