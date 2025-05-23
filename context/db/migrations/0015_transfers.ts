import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
			INSERT INTO transfers (job_id, created_at, debt, leverage) VALUES ('morpho-withdraw-0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E-0x760b14c9003f08ac4bf0cfb02596ee4d6f0548a4fde5826bfd56befb9ed62ae9', TIMESTAMP '2025-05-23 10:38:23', 10000.901958, 8);
	`)
}

export function down(pgm: MigrationBuilder): void {
}
