import dotenv from "dotenv"
import {createContext} from "../context"
import {runMigrations} from "../context/db/run-migrations"
import {logAsync} from "../common/log-async"
import {PT_sUSDe_FEB26, sUSDe_ADDRESS, USDe_ADDRESS} from "../common/addresses"
import {updateJobs} from "../context/db/update-jobs"
import {Pool} from "pg";
import {SyncService} from "../context/service/sync-service";
import {sleep} from "../common/sleep";

dotenv.config()

async function runJobs() {
	console.log("Starting cron jobs")

	const {connectionPool, syncService, duneSyncService, duneService} = await createContext()
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

	cron.schedule('0 * * * *', () => {
		console.log("Updating views")

		logAsync(
			refreshViews(connectionPool),
			"refreshing views"
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
			syncAllNonPTs(syncService),
			"syncing non-PTs"
		)


		logAsync(
			syncAllPTs(syncService),
			"syncing PTs"
		)
	})

	console.log("Initialized cron jobs")
}

async function syncAllNonPTs(syncService: SyncService) {
	const start = Date.now()

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0xa9f70093360419b4544f17a4553ac5847d896be23f020295bd95c24af4df700e",
		})
	} catch (e) {
		console.error("Error syncing wsrUSD/USDT", e)
	}

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0x32e253d33f1594a67fc6ef51bf7a39cc4bf2d14904998dee769706fcde489ed9",
		})
	} catch (e) {
		console.error("Error syncing wsrUSD/USDC", e)
	}

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0xeb17955ea422baeddbfb0b8d8c9086c5be7a9cfdefb292119a102e981a30062e",
			collateralShare: 1,
			debtShare: 1,
		})
	} catch (e) {
		console.error("Error syncing stcUSD/USDC", e)
	}

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0x3274643db77a064abd3bc851de77556a4ad2e2f502f4f0c80845fa8f909ecf0b"
		})
	} catch (e) {
		console.error("Error syncing sUSDS/USDT", e)
	}

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0xe1b65304edd8ceaea9b629df4c3c926a37d1216e27900505c04f14b2ed279f33"
		})
	} catch (e) {
		console.error("Error syncing RLP/USDC", e)
	}

	try {
		await syncService.syncData({
			type: "euler-withdraw",
			accountId: 10,
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			collateralVault: "0xdB6165bd1F90cb507F30AbDb42c4596CE4D894f4",
			debtVault: "0xba98fC35C9dfd69178AD5dcE9FA29c64554783b5",
		})
	} catch (e) {
		console.error("Error syncing RLP/USDC", e)
	}

	console.log("non-PTs synchronized in", (Date.now() - start), "ms")
}

async function syncAllPTs(syncService: SyncService) {
	const start = Date.now()

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0x802ec6e878dc9fe6905b8a0a18962dcca10440a87fa2242fbf4a0461c7b0c789"
		})
	} catch (e) {
		console.error("error syncing PT-cusd JAN / USDC", e)
	}

	await sleep(5000)

	try {
		await syncService.syncData({
			type: "aave-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x7286fb0a79BEF605c5BF63B65Ce9607CBB26d502",
			collateralToken: PT_sUSDe_FEB26,
			debtToken: USDe_ADDRESS,
			debtShare: 0.1,
			collateralShare: 0.1,
		})
	} catch (e) {
		console.error("error syncing PT-cusd JAN / USDC", e)
	}

	await sleep(5000)

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			marketId: "0x79b4e55cef9e7c214b5cc965e1984229ada26a66051e35366a75c4d92b776735",
		})
	} catch (e) {
		console.error("error syncing PT-srUSDe JAN / USDT", e)
	}

	await sleep(5000)

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0x03f715ef1ae508ab3e1faf4dffdbf2a077d1f0ad10c5aad42cf4438d5e3328af"
		})
	} catch (e) {
		console.error("error syncing PT-stcUSD JAN / USDC", e)
	}

	console.log("PTs synchronized in", (Date.now() - start), "ms")
}

async function refreshViews(connectionPool: Pool) {
	let start = Date.now()
	try {
		await connectionPool.query("REFRESH MATERIALIZED VIEW main_data_week")
	} catch (e) {
		console.error(e)
	}
	console.log("Refreshed main_data_week in", (Date.now() - start), "ms")
	start = Date.now()
	try {
		await connectionPool.query("REFRESH MATERIALIZED VIEW main_data_day")
	} catch (e) {
		console.error(e)
	}
	console.log("Refreshed main_data_day in", (Date.now() - start), "ms")
	start = Date.now()
	try {
		await connectionPool.query("REFRESH MATERIALIZED VIEW position_values_ext_mat")
	} catch (e) {
		console.error(e)
	}
	console.log("Refreshed position_values_ext_mat in", (Date.now() - start), "ms")
}

runJobs().then()
