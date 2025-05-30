import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
			INSERT INTO transfers (job_id, created_at, debt, leverage) VALUES ('morpho-withdraw-0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E-0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e', TIMESTAMP '2025-05-30 22:58:59', 20005.726844, 8);
	`)
}

export function down(pgm: MigrationBuilder): void {
}
