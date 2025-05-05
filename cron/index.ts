import { createContext } from "../context"
import { runMigrations } from "../context/db/run-migrations"
import { logAsync } from "../common/log-async"

async function runJobs() {
	console.log("Starting cron jobs")

	const { connectionPool, syncService } = await createContext()
	await runMigrations(connectionPool)

	const cron = await import("node-cron")
	cron.schedule('* * * * *', () => {
		console.log("Running cron job")

		//PT-DAI <-> eUSDe
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1"
			})
		)

		//rUSD
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e"
			})
		)

		//PT-DAI <-> sUSDe
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905"
			})
		)

		//sUSDS/USDT
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5"
			})
		)
		// aave sUSDE
		// logAsync(
		// 	syncService.syncData({
		// 		type: "aave-withdraw",
		// 		from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
		// 		vault: "0xe87c1cb159E0bC50817642F82a1e6F1C7283eE23",
		// 		collateralToken: sUSDe_ADDRESS,
		// 		debtToken: USDT_ADDRESS,
		// 	})
		// )

		// morpho cusd0-USD
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c"
			})
		)

		// morpho PT-rUSD
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x10b401f4254a7039b7168c5a614c81ea8be698186cfb33aa56ac2adbcf0e88f9"
			})
		)

		// morpho slvlUSD
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x8b1bc4d682b04a16309a8adf77b35de0c42063a7944016cfc37a79ccac0007b6"
			})
		)

		//ezETH
		// logAsync(
		// 	syncService.syncData({
		// 		type: "compound-withdraw",
		// 		from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
		// 		vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
		// 		comet: COMET_WETH_ADDRESS,
		// 		collateralToken: EZETH_ADDRESS,
		// 	})
		// )
	})

	console.log("Initialized cron jobs")
}

runJobs().then()
