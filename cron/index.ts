import dotenv from "dotenv"
import { createContext } from "../context"
import { runMigrations } from "../context/db/run-migrations"
import { logAsync } from "../common/log-async"
import {
	DAI_ADDRESS,
	PT_eUSDe_AUG,
	PT_sUSDe_SEP,
	SDAI_ADDRESS,
	sUSDe_ADDRESS,
	SYRUP_USDC,
	usdc,
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
				queryId: "5514773",
				apiKey: process.env.DUNE_API_KEY!,
			}),
			"updating leverated strategies details dune query"
		)
	})

	cron.schedule('0 5 * * *', () => {
		console.log("Updating leverated strategies dune query data")
		logAsync(
			duneSyncService.syncQueryToPostgres({
				queryId: "5514773",
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
		logAsync(
			connectionPool.query("REFRESH MATERIALIZED VIEW position_values_ext_mat"),
			"refreshing position_values_ext_mat"
		)
	})

	setInterval(() => {
		logAsync(
			syncService.syncData({
				type: "aave-free-supply",
				token: PT_sUSDe_SEP,
				aToken: "0x5f4a0873a3A02f7C0CB0e13a1d4362a1AD90e751",
			}),
			"syncing PT-sUSDe-Sep supply cap"
		)
	}, 5000)

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
				type: "compound-health-factor",
				from: "0x21F1359b6DD3392d3DC567d005d83B6d017CC60D",
				comet: "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07",
				collateral: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"
			}),
			"syncing BTC HF"
		)
		logAsync(
			syncService.syncData({
				type: "compound-health-factor",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				comet: "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07",
				collateral: "0x5979D7b546E38E414F7E9822514be443A4800529"
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

		//aave PT-sUSDE-Sep
		logAsync(
			syncService.syncData({
				type: "aave-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x7286fb0a79BEF605c5BF63B65Ce9607CBB26d502",
				collateralToken: PT_sUSDe_SEP,
				debtToken: USDT_ADDRESS,
			}),
			"syncing Aave PT-sUSDE-Sep USDT"
		)

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
