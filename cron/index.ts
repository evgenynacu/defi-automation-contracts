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

	cron.schedule('0 3 */5 * *', () => {
		console.log("Updating leverated strategies dune query")
		logAsync(
			duneService.executeQuery({
				queryId: "5514773",
				apiKey: process.env.DUNE_API_KEY!,
			}),
			"updating leverated strategies details dune query"
		)
	})

	cron.schedule('0 5 */5 * *', () => {
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

	cron.schedule('* * * * *', () => {
		console.log("Running cron job")

		logAsync(
			syncService.syncData({
				type: "pendle-implied-rate",
				market: "0x4eaa571eafcd96f51728756bd7f396459bb9b869"
			}),
			"checking PT USDe Nov rate"
		)
		logAsync(
			syncService.syncData({
				type: "pendle-implied-rate",
				market: "0xb6ac3d5da138918ac4e84441e924a20daa60dbdd"
			}),
			"checking PT sUSDe nov rate"
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
				fromToken: USDC,
				toToken: sUSDe_ADDRESS,
				amount: 100000000000n,
				divider: 10n ** 12n,
			}),
			"checking USDC-sUSDe rate"
		)
		logAsync(
			syncService.syncData({
				type: "swap-rate",
				fromToken: sUSDe_ADDRESS,
				toToken: USDC,
				amount: 100000000000000000000000n,
				multiplier: 10n ** 12n,
			}),
			"checking sUSDe-USDC rate"
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
		// logAsync(
		// 	syncService.syncData({
		// 		type: "aave-health-factor",
		// 		from: "0x5764CfcFb4C206f497C5B65684Dd187dF8E30543",
		// 	}),
		// 	"syncing Misc HF"
		// )

		//aave PT-sUSDE-Sep
		logAsync(
			syncService.syncData({
				type: "aave-withdraw",
				from: "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E",
				vault: "0x7286fb0a79BEF605c5BF63B65Ce9607CBB26d502",
				collateralToken: sUSDe_ADDRESS,
				debtToken: USDC,
			}),
			"syncing Aave sUSDE/USDC"
		)

		logAsync(
			syncService.syncData({
				type: "euler-withdraw",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				from: "0x089fa9741628c1A4576F5BA47E02D1180b581e36",
				accountId: 2,
				collateralVault: "0x0391d9029713B1E9Ee1e241CB53D6BC89bAf299d",
				debtVault: "0xe0a80d35bB6618CBA260120b279d357978c42BCE",
			}),
			"syncing PT-tUSDe/USDC DEC-25"
		)

		logAsync(
			syncService.syncData({
				type: "aave-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb",
				collateralToken: sUSDe_ADDRESS,
				debtToken: USDC,
				debtShare: 0.5,
				collateralShare: 1,
			}),
			"syncing sUSDe/USDC [USD]"
		)

		logAsync(
			syncService.syncData({
				type: "aave-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb",
				collateralToken: USDe_ADDRESS,
				debtToken: USDC,
				debtShare: 0.5,
				collateralShare: 1,
			}),
			"syncing sUSDe/USDC [USD]"
		)

		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0x8a71a66ac828c2b6d4f8accce5859aba0822b502f3833bec4aff09479affffdb"
			}),
			"syncing PT-CUSDO NOV / USDC [USD]"
		)

		logAsync(
			syncService.syncData({
				type: "morpho-withdraw",
				from: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
				vault: "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240",
				marketId: "0xd3146eb281fff405b3fe418723899a890cb2f29646160a07af81ca241e2ec96e"
			}),
			"syncing PT-mMEV OCT / USDC [USD]"
		)
	})

	console.log("Initialized cron jobs")
}

runJobs().then()
