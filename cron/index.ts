import dotenv from "dotenv"
import {createContext} from "../context"
import {runMigrations} from "../context/db/run-migrations"
import {logAsync} from "../common/log-async"
import {sUSDe_ADDRESS, USDC, USDe_ADDRESS, WEETH_ADDRESS, WETH_ADDRESS, WSTETH_ADDRESS} from "../common/addresses"
import {updateJobs} from "../context/db/update-jobs"

dotenv.config()

async function runJobs() {
	console.log("Starting cron jobs")

	const { connectionPool, syncService, duneSyncService, duneService } = await createContext()
	await runMigrations(connectionPool)

	console.log("Updating jobs")
	await updateJobs(connectionPool)

	const cron = await import("node-cron")

/*
	cron.schedule('0 3 *!/5 * *', () => {
		console.log("Updating leverated strategies dune query")
		logAsync(
			duneService.executeQuery({
				queryId: "5514773",
				apiKey: process.env.DUNE_API_KEY!,
			}),
			"updating leverated strategies details dune query"
		)
	})

	cron.schedule('0 5 *!/5 * *', () => {
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
*/

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

	cron.schedule('* * * * *', () => {
		console.log("Running cron job")

		// logAsync(
		// 	syncService.syncData({
		// 		type: "swap-rate",
		// 		fromToken: WETH_ADDRESS,
		// 		toToken: WEETH_ADDRESS,
		// 		amount: 100000000000000000000n,
		// 	}),
		// 	"checking WETH-weETH rate"
		// )
		// logAsync(
		// 	syncService.syncData({
		// 		type: "swap-rate",
		// 		fromToken: WETH_ADDRESS,
		// 		toToken: WSTETH_ADDRESS,
		// 		amount: 100000000000000000000n,
		// 	}),
		// 	"checking WETH-wstETH rate"
		// )
		// logAsync(
		// 	syncService.syncData({
		// 		type: "swap-rate",
		// 		fromToken: WEETH_ADDRESS,
		// 		toToken: WETH_ADDRESS,
		// 		amount: 100000000000000000000n,
		// 	}),
		// 	"checking weETH-WETH rate"
		// )
		// logAsync(
		// 	syncService.syncData({
		// 		type: "swap-rate",
		// 		fromToken: WSTETH_ADDRESS,
		// 		toToken: WETH_ADDRESS,
		// 		amount: 100000000000000000000n,
		// 	}),
		// 	"checking wstETH-WETH rate"
		// )
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

		// logAsync(
		// 	syncService.syncData({
		// 		type: "swap-rate",
		// 		fromToken: USDC,
		// 		toToken: sUSDe_ADDRESS,
		// 		amount: 100000000000n,
		// 		divider: 10n ** 12n,
		// 	}),
		// 	"checking USDC-sUSDe rate"
		// )
		// logAsync(
		// 	syncService.syncData({
		// 		type: "swap-rate",
		// 		fromToken: sUSDe_ADDRESS,
		// 		toToken: USDC,
		// 		amount: 100000000000000000000000n,
		// 		multiplier: 10n ** 12n,
		// 	}),
		// 	"checking sUSDe-USDC rate"
		// )

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
				type: "morpho-withdraw",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x3274643db77a064abd3bc851de77556a4ad2e2f502f4f0c80845fa8f909ecf0b"
			}),
			"syncing sUSDS/USDT"
		)
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x7fd694cd13880ce994c61e8f8991ce0c9e321e3d50f548dd62a1b6e610d29f32"
			}),
			"syncing PT-CUSDO NOV / USDT [USD]"
		)
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x802ec6e878dc9fe6905b8a0a18962dcca10440a87fa2242fbf4a0461c7b0c789"
			}),
			"syncing PT-cusd JAN / USDC [vault]"
		)
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x7fd694cd13880ce994c61e8f8991ce0c9e321e3d50f548dd62a1b6e610d29f32"
			}),
			"syncing PT-CUSDO NOV / USDT [Vault]"
		)
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x21b67f89513da0b0c94af8778134a1ba3f762f944f16208b42cc0663b07eaf05"
			}),
			"syncing PT-iUSD DEC / USDC [vault]"
		)
		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xe1b65304edd8ceaea9b629df4c3c926a37d1216e27900505c04f14b2ed279f33"
			}),
			"syncing RLP / USDC [vault]"
		)

		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				marketId: "0x79b4e55cef9e7c214b5cc965e1984229ada26a66051e35366a75c4d92b776735",
			}),
			"syncing PT-srUSDe JAN / USDT [Vault]"
		)

		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x03f715ef1ae508ab3e1faf4dffdbf2a077d1f0ad10c5aad42cf4438d5e3328af"
			}),
			"syncing PT-stcUSD JAN / USDC [Vault]"
		)
	})

	console.log("Initialized cron jobs")
}

runJobs().then()
