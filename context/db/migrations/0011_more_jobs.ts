import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0x21F1359b6DD3392d3DC567d005d83B6d017CC60D-0x544b0a093b130a3fb01b72a1279ab848575f049c73da3b5c9c718f9350a1519c', 'Morpho PT-wstUSR-Sep BTC');
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
}
