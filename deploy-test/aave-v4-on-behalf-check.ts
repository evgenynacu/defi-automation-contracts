import { JsonRpcProvider } from "ethers"
import { config as dotenvConfig } from "dotenv"
import { resolve } from "path"

dotenvConfig({ path: resolve(__dirname, "../.env") })

import { AAVE_V4_POSITION_MANAGERS } from "../common/aave-v4/addresses"
import { getReserveId } from "../common/aave-v4/get-reserve-id"
import { isGranted } from "../common/approve-aave-v4-on-behalf"
import { getRpcUrl } from "../common/get-rpc-url"
import {
	IConfigPositionManager__factory,
	ISpoke__factory,
	ITakerPositionManager__factory,
} from "../typechain-types"
import { address, toAddress } from "../common/types"
import { PT_USDG_SEP26_USDG } from "../common/aave-v4/positions"

/**
 * Readiness check for an on-behalf Aave v4 position: reports every permission the deposit and withdraw
 * flows need, for the actual collateral and debt reserves.
 *
 * Both approval layers are checked. Manager activation alone is governance state and says nothing about
 * whether this owner authorised anything — checking only that is what let a missing layer-1 approval
 * reach mainnet and revert with Unauthorized().
 *
 *   TS_NODE_PROJECT=./tsconfig.server.json npx ts-node deploy-test/aave-v4-on-behalf-check.ts OWNER VAULT
 */
const { spoke: SPOKE, collateral: COLLATERAL, debt: DEBT } = PT_USDG_SEP26_USDG

async function main() {
	const owner = toAddress(process.argv[2] || "")
	const vault = toAddress(process.argv[3] || "")
	const runner = new JsonRpcProvider(getRpcUrl(1))

	const spoke = ISpoke__factory.connect(SPOKE, runner)
	const taker = ITakerPositionManager__factory.connect(AAVE_V4_POSITION_MANAGERS.TAKER, runner)
	const config = IConfigPositionManager__factory.connect(AAVE_V4_POSITION_MANAGERS.CONFIG, runner)

	const [collateralReserveId, debtReserveId] = await Promise.all([
		getReserveId(runner, SPOKE, COLLATERAL.hub, COLLATERAL.token),
		getReserveId(runner, SPOKE, DEBT.hub, DEBT.token),
	])

	console.log(`spoke ${SPOKE}`)
	console.log(`owner ${owner}  vault ${vault}`)
	console.log(`collateral reserve ${collateralReserveId}, debt reserve ${debtReserveId}\n`)

	let missing = 0
	const report = (ok: boolean, label: string, detail = "") => {
		if (!ok) missing++
		console.log(`  ${ok ? "ok  " : "MISSING"} ${label}${detail ? "  " + detail : ""}`)
	}

	// layer 1 — the owner authorises each manager contract on this spoke
	for (const [name, manager] of Object.entries(AAVE_V4_POSITION_MANAGERS)) {
		const [active, approved] = await Promise.all([
			spoke.isPositionManagerActive(manager),
			spoke.isPositionManager(owner, manager),
		])
		report(active && approved, `layer1 ${name}`, `active=${active} approvedByOwner=${approved}`)
	}

	// layer 2 — the managers authorise this vault, per reserve where applicable
	const [withdrawAllowance, borrowAllowance, permissions] = await Promise.all([
		taker.withdrawAllowance(SPOKE, collateralReserveId, owner, vault),
		taker.borrowAllowance(SPOKE, debtReserveId, owner, vault),
		config.getConfigPermissions(SPOKE, vault, owner),
	])
	// same exact-max rule the setup helper applies: a finite allowance is consumed as the position is
	// worked and does not cover a MaxUint256 full exit, so "positive" is not "ready"
	report(isGranted(withdrawAllowance), `layer2 withdraw allowance (collateral reserve ${collateralReserveId})`, withdrawAllowance === 0n ? "none" : isGranted(withdrawAllowance) ? "max" : `finite: ${withdrawAllowance}`)
	report(isGranted(borrowAllowance), `layer2 borrow allowance (debt reserve ${debtReserveId})`, borrowAllowance === 0n ? "none" : isGranted(borrowAllowance) ? "max" : `finite: ${borrowAllowance}`)
	report(permissions.canSetUsingAsCollateral, "layer2 canSetUsingAsCollateral")

	// position state the first borrow depends on
	const [usingAsCollateral] = await spoke.getUserReserveStatus(collateralReserveId, owner)
	report(usingAsCollateral, "collateral reserve flagged as collateral")

	console.log(missing === 0
		? "\nReady: every permission the deposit and withdraw flows need is in place."
		: `\n${missing} item(s) missing — run the 701 setup script.`)
	if (missing > 0) process.exitCode = 1
}

main().catch(e => { console.error(e); process.exit(1) })
