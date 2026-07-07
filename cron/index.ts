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
	USDT_ADDRESS
} from "../common/addresses"
import {updateJobs} from "../context/db/update-jobs"
import {SyncService} from "../context/service/sync-service";
import {sleep} from "../common/sleep";
import {refreshViews} from "../context/service/refresh-views-service";
import express from "express";
import {register} from "../context/metrics/registry";

dotenv.config()

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

	console.log("non-PTs synchronized in", (Date.now() - start), "ms")
}

async function syncAllPTs(syncService: SyncService) {
	const start = Date.now()

	try {
		await syncService.syncData({
			type: "morpho-withdraw",
			from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
			vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
			marketId: "0xdf6ca97d41975a6996e9db491cb38152b65d7c00807dfe15d95d8d76e5d122e0",
			debtShare: 1,
			collateralShare: 1,
		})
	} catch (e) {
		console.error("Error syncing PT-sUSDD/USDT", e)
	}

	console.log("PTs synchronized in", (Date.now() - start), "ms")
}

runJobs().then()
