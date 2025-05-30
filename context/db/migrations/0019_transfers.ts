import { MigrationBuilder } from 'node-pg-migrate'

export const shorthands = undefined

export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
			INSERT INTO transfers (job_id, created_at, debt, leverage) VALUES ('morpho-withdraw-0x21F1359b6DD3392d3DC567d005d83B6d017CC60D-0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5', TIMESTAMP '2025-05-30 23:24:47', 4000, 10);
	`)
}

export function down(pgm: MigrationBuilder): void {
}
