import { JsonRpcProvider } from "ethers"
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"

dotenvConfig({ path: resolve(__dirname, "../.env") })

import { AAVE_V4_HUBS, AAVE_V4_SPOKES } from "../common/aave-v4/addresses"
import { getReserveCapacity } from "../common/aave-v4/get-capacity"
import { getRpcUrl } from "../common/get-rpc-url"
import { ERC20__factory, ISpoke__factory } from "../typechain-types"
import { address } from "../common/types"

/**
 * Lists every reserve on every Aave v4 spoke with its remaining supply/borrow headroom.
 *
 * Run before wiring a strategy to a spoke: caps bind independently of hub liquidity, and matured or
 * wound-down reserves show up here as cap 0.
 *
 *   TS_NODE_PROJECT=./tsconfig.server.json npx ts-node deploy-test/aave-v4-reserves.ts [SPOKE_NAME]
 */
const HUB_NAMES = new Map(Object.entries(AAVE_V4_HUBS).map(([k, v]) => [v.toLowerCase(), k]))

async function main() {
	const runner = new JsonRpcProvider(getRpcUrl(1))
	const only = process.argv[2]?.toUpperCase()

	for (const [name, spoke] of Object.entries(AAVE_V4_SPOKES)) {
		if (only && name !== only) continue
		if (name === "TREASURY") continue

		const contract = ISpoke__factory.connect(spoke, runner)
		const count = await contract.getReserveCount().catch(() => 0n)
		if (count === 0n) continue

		console.log(`\n=== ${name}  ${spoke}`)
		for (let id = 0n; id < count; id++) {
			const reserve = await contract.getReserve(id)
			const symbol = await ERC20__factory.connect(reserve.underlying, runner).symbol().catch(() => "?")
			const hub = HUB_NAMES.get(reserve.hub.toLowerCase()) || reserve.hub
			const cap = await getReserveCapacity(runner, spoke as address, id)
			const d = reserve.decimals

			console.log(
				`  #${String(id).padEnd(2)} ${symbol.padEnd(20)} ${hub.padEnd(14)}` +
				` supply-left ${fmt(cap.supplyLeft, d).padStart(14)}` +
				` borrowable ${fmt(cap.borrowable, d).padStart(14)}` +
				` risk ${reserve.collateralRisk}`
			)
		}
	}
}

function fmt(v: bigint, decimals: bigint) {
	if (v === 0n) return "-"
	return (Number(v) / 10 ** Number(decimals)).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

main().catch(e => { console.error(e); process.exit(1) })
