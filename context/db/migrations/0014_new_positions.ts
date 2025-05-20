import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0x21F1359b6DD3392d3DC567d005d83B6d017CC60D-0xbfed072faee09b963949defcdb91094465c34c6c62d798b906274ef3563c9cac', 'Morpho srUSD/USDC BTC');
      INSERT INTO transfers (job_id, created_at, debt, leverage) VALUES ('morpho-withdraw-0x21F1359b6DD3392d3DC567d005d83B6d017CC60D-0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5', TIMESTAMP '2025-05-20 09:42:59', 5000, 10);
      INSERT INTO transfers (job_id, created_at, debt, leverage) VALUES ('morpho-withdraw-0xEbca6F665A80466f410B3c2FD5a1696eDB664A42-0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c', TIMESTAMP '2025-05-14 18:24:11', -5714.42, 8);
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
}
