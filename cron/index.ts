import dotenv from "dotenv"
import { createContext } from "../context"
import { runMigrations } from "../context/db/run-migrations"
import { logAsync } from "../common/log-async"
import {
	DAI_ADDRESS,
	PT_eUSDe_AUG, SDAI_ADDRESS, sUSDe_ADDRESS, SYRUP_USDC, usdc,
	USDe_ADDRESS,
	USDT_ADDRESS,
	WEETH_ADDRESS,
	WETH_ADDRESS,
	WSTETH_ADDRESS
} from "../common/addresses"
import { updateJobs } from "../context/db/update-jobs"

dotenv.config()

async function runJobs() {
	console.log("Starting cron jobs")

	const { connectionPool, syncService, duneSyncService, duneService } = await createContext()
	await runMigrations(connectionPool)

	console.log("Updating jobs")
	await updateJobs(connectionPool)

	const cron = await import("node-cron")

	cron.schedule('0 3 * * *', () => {
		console.log("Updating leverated strategies dune query")
		logAsync(
			duneService.executeQuery({
				queryId: "5333311",
				apiKey: process.env.DUNE_API_KEY!,
			}),
			"updating leverated strategies dune query"
		)
		logAsync(
			duneService.executeQuery({
				queryId: "5346846",
				apiKey: process.env.DUNE_API_KEY!,
			}),
			"updating leverated strategies details dune query"
		)
	})

	cron.schedule('0 5 * * *', () => {
		console.log("Updating leverated strategies dune query data")
		logAsync(
			duneSyncService.syncQueryToPostgres({
				queryId: "5333311",
				apiKey: process.env.DUNE_API_KEY!,
				truncateBeforeInsert: true,
				tableName: "leveraged_strategies",
				doNotExecute: true,
			}),
			"updating leverated strategies dune query"
		)

		logAsync(
			duneSyncService.syncQueryToPostgres({
				queryId: "5346846",
				apiKey: process.env.DUNE_API_KEY!,
				truncateBeforeInsert: true,
				tableName: "leveraged_strategies_details",
				doNotExecute: true,
				pageSize: 2000,
			}),
			"updating leverated strategies details dune query"
		)
	})

	cron.schedule('*/30 * * * *', () => {
		console.log("Updating views")

		logAsync(
			connectionPool.query("REFRESH MATERIALIZED VIEW main_data_week"),
			"refreshing main_data_week"
		)
		logAsync(
			connectionPool.query("REFRESH MATERIALIZED VIEW main_data_day"),
			"refreshing main_data_day"
		)
	})

	cron.schedule('* * * * *', () => {
		console.log("Running cron job")

		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: usdc,
				toToken: SYRUP_USDC,
				amount: 200000000000n,
			}),
			"checking usdc-syrupUSDC rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: SYRUP_USDC,
				toToken: usdc,
				amount: 200000000000n,
			}),
			"checking syrupUSDC-usdc rate"
		)

		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: WETH_ADDRESS,
				toToken: WEETH_ADDRESS,
				amount: 100000000000000000000n,
			}),
			"checking WETH-weETH rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: WETH_ADDRESS,
				toToken: WSTETH_ADDRESS,
				amount: 100000000000000000000n,
			}),
			"checking WETH-wstETH rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: WEETH_ADDRESS,
				toToken: WETH_ADDRESS,
				amount: 100000000000000000000n,
			}),
			"checking weETH-WETH rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: WSTETH_ADDRESS,
				toToken: WETH_ADDRESS,
				amount: 100000000000000000000n,
			}),
			"checking wstETH-WETH rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: USDe_ADDRESS,
				toToken: sUSDe_ADDRESS,
				amount: 100000000000000000000000n,
			}),
			"checking USDe-sUSDe rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: sUSDe_ADDRESS,
				toToken: USDe_ADDRESS,
				amount: 100000000000000000000000n,
			}),
			"checking sUSDe-USDe rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: SDAI_ADDRESS,
				toToken: DAI_ADDRESS,
				amount: 100000000000000000000000n,
			}),
			"checking USDe-sUSDe rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: DAI_ADDRESS,
				toToken: SDAI_ADDRESS,
				amount: 100000000000000000000000n,
			}),
			"checking sUSDe-USDe rate"
		)

		logAsync(
			syncService.syncData({
				type: "aave-health-factor",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
			}),
			"syncing BTC HF"
		)
		logAsync(
			syncService.syncData({
				type: "aave-health-factor",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
			}),
			"syncing ETH HF"
		)
		logAsync(
			syncService.syncData({
				type: "aave-health-factor",
				from: "0x5764CfcFb4C206f497C5B65684Dd187dF8E30543",
			}),
			"syncing Misc HF"
		)

		//rUSD
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e"
			}),
			"syncing rUSD"
		)

		//syrupUSDC Aug 25
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x96a4399f2c837f8aa34c39718e30625a84f9285991f0a08d1f2997e15bbeeaa8"
			}),
			"syncing PT-syrupUSDC-Aug"
		)

		//srUSD/USDC BTC
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbfed072faee09b963949defcdb91094465c34c6c62d798b906274ef3563c9cac"
			}),
			"syncing srUSD/USDC BTC"
		)
		//srUSD/USDC USD
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbfed072faee09b963949defcdb91094465c34c6c62d798b906274ef3563c9cac"
			}),
			"syncing srUSD/USDC USD"
		)

		//sUSDS/USDT
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5"
			}),
			"syncing sUSDS/USDT [USD]"
		)

		//sUSDS/USDT BTC
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xb5b0ff0fccf16dff5bef6d2d001d60f5c4ab49df1020a01073d3ad635c80e8d5"
			}),
			"syncing sUSDS/USDT [BTC]"
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
			}),
			"syncing Aave PT-eUSDE-Aug"
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
			}),
			"syncing PT-rUSD"
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
		// logAsync(
		// 	syncService.syncData({
		// 		type: "morpho-withdraw",
		// 		from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
		// 		vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
		// 		marketId: "0x760b14c9003f08ac4bf0cfb02596ee4d6f0548a4fde5826bfd56befb9ed62ae9"
		// 	})
		// )

		// morpho PT-sUSDe/July ETH
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef"
			}),
			"syncing PT-sUSDe/July [ETH]"
		)

		// morpho PT-sUSDe/July BTC
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef"
			}),
			"syncing PT-sUSDe/July [BTC]"
		)
		//debt = usdc
		//eth
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e"
			}),
			"syncing PT-sUSDe/July-USDC [ETH]"
		)
		//BTC wallet
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e"
			}),
			"syncing PT-sUSDe/July-USDC [BTC]"
		)
		//USD wallet
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xbc552f0b14dd6f8e60b760a534ac1d8613d3539153b4d9675d697e048f2edc7e"
			}),
			"syncing PT-sUSDe/July-USDC [USD]"
		)

		//wstUSR-SEP
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xeec6c7e2ddb7578f2a7d86fc11cf9da005df34452ad9b9189c51266216f5d71b"
			}),
			"syncing wstUSR-SEP [ETH]"
		)
		//btc
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xeec6c7e2ddb7578f2a7d86fc11cf9da005df34452ad9b9189c51266216f5d71b"
			}),
			"syncing wstUSR-SEP [BTC]"
		)

		//csUSDL-JUL
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x544b0a093b130a3fb01b72a1279ab848575f049c73da3b5c9c718f9350a1519c"
			}),
			"syncing csUSDL-JUL [ETH]"
		)

		//PT-USDS Aug
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xa458018cf1a6e77ebbcc40ba5776ac7990e523b7cc5d0c1e740a4bbc13190d8f"
			}),
			"syncing PT-USDS Aug [ETH]"
		)

		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x5764CfcFb4C206f497C5B65684Dd187dF8E30543",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x544b0a093b130a3fb01b72a1279ab848575f049c73da3b5c9c718f9350a1519c"
			}),
			"syncing csUSDL-JUL [Misc]"
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
