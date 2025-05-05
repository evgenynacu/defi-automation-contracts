import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0xEbca6F665A80466f410B3c2FD5a1696eDB664A42-0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c', 'Morpho PT-cUSDO-USD');
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
}
