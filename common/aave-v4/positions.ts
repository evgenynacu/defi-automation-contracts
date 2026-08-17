import { AAVE_V4_HUBS, AAVE_V4_SPOKES } from "./addresses"
import { AaveV4Leg } from "./types"
import { PT_USDG_24SEP2026, syrupUSDG, USDG } from "../addresses"
import { address, toAddress } from "../types"

export type AaveV4Position = {
	spoke: address
	collateral: AaveV4Leg
	/** preferred hub to borrow from */
	debt: AaveV4Leg
	/**
	 * Other hubs on this spoke that list the same debt token, tried in order when the primary is capped.
	 *
	 * Each hub has its own credit line and they fill independently, so a position pinned to one hub stops
	 * being enterable the moment that line is exhausted.
	 */
	fallbackDebtHubs?: address[]
}

/**
 * Position definitions, kept out of the deploy scripts so the setup, deposit, withdraw and readiness
 * check all read the same market from one place — and so tools that run outside hardhat can import it.
 *
 * Use `npx ts-node deploy-test/aave-v4-reserves.ts` to see what each spoke lists and which hub backs it.
 */
export const PT_USDG_SEP26_USDG: AaveV4Position = {
	// "USDG Pendle" market in the Aave Pro UI
	spoke: AAVE_V4_SPOKES.USDG_PENDLE,
	collateral: { token: toAddress(PT_USDG_24SEP2026), hub: AAVE_V4_HUBS.GLOBAL_DOLLAR },
	debt: { token: toAddress(USDG), hub: AAVE_V4_HUBS.CORE },
	fallbackDebtHubs: [AAVE_V4_HUBS.GLOBAL_DOLLAR],
}

/**
 * syrupUSDG collateral against USDG debt, both on the Global Dollar hub.
 *
 * Debt is drawn from Global Dollar rather than Core: the same spoke lists USDG from both, and Core's
 * credit line is all but exhausted while Global Dollar has millions free. Check with
 * `npx ts-node deploy-test/aave-v4-reserves.ts USDG_MAPLE` before sizing, since both sides move.
 */
export const SYRUP_USDG_USDG: AaveV4Position = {
	// "USDG Maple" market in the Aave Pro UI
	spoke: AAVE_V4_SPOKES.USDG_MAPLE,
	collateral: { token: toAddress(syrupUSDG), hub: AAVE_V4_HUBS.GLOBAL_DOLLAR },
	debt: { token: toAddress(USDG), hub: AAVE_V4_HUBS.GLOBAL_DOLLAR },
	fallbackDebtHubs: [AAVE_V4_HUBS.CORE],
}
