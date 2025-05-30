import { createContext } from "../context"
import { runMigrations } from "../context/db/run-migrations"
import { logAsync } from "../common/log-async"
import { PT_eUSDe_AUG, USDT_ADDRESS } from "../common/addresses"

async function runJobs() {
	console.log("Starting cron jobs")

	const { connectionPool, syncService } = await createContext()
	await runMigrations(connectionPool)

	const cron = await import("node-cron")
	cron.schedule('*/30 * * * *', () => {
		console.log("Updating views")

		logAsync(
			connectionPool.query("REFRESH MATERIALIZED VIEW main_data_week")
		)
		logAsync(
			connectionPool.query("REFRESH MATERIALIZED VIEW main_data_day")
		)
	})

	cron.schedule('* * * * *', () => {
		console.log("Running cron job")

		//rUSD
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e"
			})
		)

		//srUSD/USDC BTC
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbfed072faee09b963949defcdb91094465c34c6c62d798b906274ef3563c9cac"
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

		//sUSDS/USDT BTC
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
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

		//aave PT-eUSDE-Aug
		logAsync(
			syncService.syncData({
				type: "aave-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0xE92096ecf53E4Ed58c8Dbc15af62249FaA76a7C8",
				collateralToken: PT_eUSDe_AUG,
				debtToken: USDT_ADDRESS,
			})
		)

		// morpho cusd0-USD
		// logAsync(
		// 	syncService.syncData({
		// 		type: "morpho-withdraw",
		// 		from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
		// 		vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
		// 		marketId: "0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c"
		// 	})
		// )
		//
		// logAsync(
		// 	syncService.syncData({
		// 		type: "morpho-withdraw",
		// 		from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
		// 		vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
		// 		marketId: "0x457b54a03c6bba984470d5687ec6df7967c0168bdc0052315713bfd287cd576c"
		// 	})
		// )

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
		// logAsync(
		// 	syncService.syncData({
		// 		type: "morpho-withdraw",
		// 		from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
		// 		vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
		// 		marketId: "0x8b1bc4d682b04a16309a8adf77b35de0c42063a7944016cfc37a79ccac0007b6"
		// 	})
		// )

		// morpho PT-USDe/July
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x760b14c9003f08ac4bf0cfb02596ee4d6f0548a4fde5826bfd56befb9ed62ae9"
			})
		)

		// morpho PT-sUSDe/July ETH
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef"
			})
		)

		// morpho PT-sUSDe/July BTC
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef"
			})
		)
		//debt = usdc
		//eth
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e"
			})
		)
		//BTC wallet
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e"
			})
		)
		//USD wallet
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e"
			})
		)

		//wstUSR-SEP
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xeec6c7e2ddb7578f2a7d86fc11cf9da005df34452ad9b9189c51266216f5d71b"
			})
		)
		//btc
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xeec6c7e2ddb7578f2a7d86fc11cf9da005df34452ad9b9189c51266216f5d71b"
			})
		)

		//csUSDL-JUL
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x544b0a093b130a3fb01b72a1279ab848575f049c73da3b5c9c718f9350a1519c"
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
