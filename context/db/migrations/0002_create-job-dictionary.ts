import { MigrationBuilder } from 'node-pg-migrate'

// noinspection JSUnusedGlobalSymbols
export const shorthands = undefined

// noinspection JSUnusedGlobalSymbols
export function up(pgm: MigrationBuilder): void {
	pgm.sql(`
      CREATE TABLE jobs
      (
          id         VARCHAR PRIMARY KEY,
          name       VARCHAR
      );

			INSERT INTO jobs (id, name) VALUES ('aave-withdraw-0xe87c1cb159E0bC50817642F82a1e6F1C7283eE23-0x9D39A5DE30e57443BfF2A8307A4256c8797A3497-0xdAC17F958D2ee523a2206206994597C13D831ec7', 'Aave sUSDe/USDT');
      INSERT INTO jobs (id, name) VALUES ('compound-withdraw-0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E-0xA17581A9E3356d9A858b789D68B4d866e593aE94-0xbf5495Efe5DB9ce00f80364C8B423567e58d2110', 'Compound ezETH');
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0xEbca6F665A80466f410B3c2FD5a1696eDB664A42-0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905', 'Morpho sUSDe/DAI');
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0xEbca6F665A80466f410B3c2FD5a1696eDB664A42-0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1', 'Morpho eUSDe/DAI');
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0xEbca6F665A80466f410B3c2FD5a1696eDB664A42-0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5', 'Morpho sUSDS/USDT');
      INSERT INTO jobs (id, name) VALUES ('morpho-withdraw-0xEbca6F665A80466f410B3c2FD5a1696eDB664A42-0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e', 'Morpho srUSD');
	`)
}

// noinspection JSUnusedGlobalSymbols
export function down(pgm: MigrationBuilder): void {
	pgm.sql(`
      DROP TABLE IF EXISTS jobs;
	`)
}
