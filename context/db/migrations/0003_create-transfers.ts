import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      CREATE TABLE transfers
      (
          job_id      VARCHAR,
          created_at  TIMESTAMP NOT NULL,
          debt        DOUBLE PRECISION,
		      leverage    REAL
      );

			INSERT INTO transfers (job_id, created_at, debt, leverage) VALUES ('morpho-withdraw-0xEbca6F665A80466f410B3c2FD5a1696eDB664A42-0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5', TIMESTAMP '2025-04-21 12:01:47', 11274.144489, 10);
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS transfers;
	`)
}
