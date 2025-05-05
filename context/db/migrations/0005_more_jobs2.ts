import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E-0x10b401f4254a7039b7168c5a614c81ea8be698186cfb33aa56ac2adbcf0e88f9', 'Morpho PT-rUSD');
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E-0x8b1bc4d682b04a16309a8adf77b35de0c42063a7944016cfc37a79ccac0007b6', 'Morpho slvlUSD');
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
}
