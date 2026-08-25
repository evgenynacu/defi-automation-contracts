import dotenv from "dotenv"
import {createContext} from "../context"
import {runMigrations} from "../context/db/run-migrations"
import {logAsync} from "../common/log-async"
import {
	GHO, PT_srUSDE_2APR2026, PT_sUSDe_7MAY2026,
	sUSDe_ADDRESS,
	SYRUP_USDT,
	USDC,
	USDe_ADDRESS,
	USDS,
	USDT_ADDRESS,
	USDG,
	syrupUSDG
} from "../common/addresses"
import {AAVE_V4_HUBS, AAVE_V4_SPOKES, getSpokeName} from "../common/aave-v4/addresses"
import {address, toAddress} from "../common/types"
import {findToken} from "../context/tokens"
import {marketIds} from "../context/morpho"
import {updateJobs} from "../context/db/update-jobs"
import {SyncService} from "../context/service/sync-service";
import {sleep} from "../common/sleep";
import {refreshViews} from "../context/service/refresh-views-service";
import express from "express";
import {register} from "../context/metrics/registry";
import {SUSDS_USDT_ROUTE_POOLS} from "../context/route-pools";

dotenv.config()

/**
 * Aave v4 spoke reserves to report capacity for.
 *
 * The hub is part of the key: a spoke can list the same token twice when it draws it from two different
 * hubs, and those are separate reserves with separate caps. Add a line here to watch another reserve.
 */
const AAVE_V4_WATCHED_RESERVES: { spoke: address, token: address, hub: address }[] = [
	// syrupUSDG collateral on the USDG Maple spoke — cap has been sitting at zero
	{
		spoke: AAVE_V4_SPOKES.USDG_MAPLE,
		token: toAddress(syrupUSDG),
		hub: AAVE_V4_HUBS.GLOBAL_DOLLAR,
	},
	// the USDG debt leg of that position — Global Dollar, where the credit line actually has room
	{
		spoke: AAVE_V4_SPOKES.USDG_MAPLE,
		token: toAddress(USDG),
		hub: AAVE_V4_HUBS.GLOBAL_DOLLAR,
	},
]

/**
 * Markets whose borrow rate is worth watching.
 *
 * A levered position pays this on the whole debt while earning the collateral's yield on the whole
 * collateral, so the two rates converging is what ends the trade — long before health factor moves.
 */
const WATCHED_BORROW_RATE_MARKETS: `0x${string}`[] = [
	// sUSDS/USDT
	"0x3274643db77a064abd3bc851de77556a4ad2e2f502f4f0c80845fa8f909ecf0b",
]

async function runJobs() {
	console.log("Starting cron jobs")

	const {connectionString, connectionPool, syncService } = await createContext()
	await runMigrations(connectionString)

	console.log("Updating jobs")
	await updateJobs(connectionPool)

	const metricsApp = express()
	metricsApp.get("/metrics", async (_req, res) => {
		res.set("Content-Type", register.contentType)
		res.end(await register.metrics())
	})
	metricsApp.get("/", (_req, res) => {
		res.status(200).json({status: "OK"})
	})
	const METRICS_PORT = Number(process.env.METRICS_PORT ?? 8080)
	metricsApp.listen(METRICS_PORT, () => console.log(`Metrics endpoint listening on ${METRICS_PORT}`))

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

	cron.schedule('0 3 * * *', () => {
		console.log("Updating views")

		logAsync(
			refreshViews(connectionString),
			"refreshing views"
		)
	})

	cron.schedule('* * * * *', () => {
		console.log("Running cron job")

		for (const marketId of WATCHED_BORROW_RATE_MARKETS) {
			logAsync(
				syncService.syncData({ type: "morpho-borrow-rate", marketId }),
				`checking morpho borrow rate ${marketIds[marketId] || marketId}`,
			)
		}

		for (const pool of SUSDS_USDT_ROUTE_POOLS) {
			logAsync(
				syncService.syncData({ type: "pool-liquidity", ...pool }),
				`checking route pool ${pool.venue}`,
			)
		}

		for (const reserve of AAVE_V4_WATCHED_RESERVES) {
			logAsync(
				syncService.syncData({ type: "aave-v4-capacity", ...reserve }),
				`checking aave v4 capacity ${getSpokeName(reserve.spoke)} ${findToken(reserve.token) || reserve.token}`,
			)
		}

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
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: USDT_ADDRESS,
				toToken: USDS,
				amount: 1000000000000n,
			}),
			"checking USDT-USDS rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: USDS,
				toToken: USDT_ADDRESS,
				amount: 1000000000000000000000000n,
				multiplier: 1000000000000n,
			}),
			"checking USDS-USDT rate"
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
		//
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
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0x3274643db77a064abd3bc851de77556a4ad2e2f502f4f0c80845fa8f909ecf0b",
			debtShare: 1,
			collateralShare: 1,
		})
	} catch (e) {
		console.error("Error syncing sUSDS/USDT", e)
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
			marketId: "0x0367161b7cb23dfd03747dd3815d1c445b0437b648a6d50346249c6e7b92ff1b",
			debtShare: 1,
			collateralShare: 1,
		})
	} catch (e) {
		console.error("Error syncing PT-sUSDS/USDT", e)
	}

	await sleep(3000)

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0x2412afc9614939a5d994397fe0b94a4f6fb8bc02bfc139e1a5956a865e2efe26",
			debtShare: 1,
			collateralShare: 1,
		})
	} catch (e) {
		console.error("Error syncing PT-USDG/USDC", e)
	}

	console.log("PTs synchronized in", (Date.now() - start), "ms")
}

runJobs().then()
