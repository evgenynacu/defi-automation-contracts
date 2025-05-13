import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0x21F1359b6DD3392d3DC567d005d83B6d017CC60D-0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef', 'Morpho PT-sUSDe-Jul BTC');
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
}
