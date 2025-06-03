import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
			INSERT INTO transfers (job_id, created_at, debt, leverage) VALUES ('morpho-withdraw-0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E-0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef', TIMESTAMP '2025-06-03 09:52:35', 15000, 8);
	`)
}

export function down(pgm: MigrationBuilder): void {
}
