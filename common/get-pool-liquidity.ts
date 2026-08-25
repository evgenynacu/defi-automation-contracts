import { Contract, type ContractRunner } from "ethers"
import { address } from "./types"

/**
 * Where a hop of a swap route keeps the liquidity it trades against.
 *
 * - erc20-balance — the venue holds its reserves as a plain token balance, so the balance is the depth.
 *   Covers Curve pools, the Sky PSM pocket, and the Uniswap v4 PoolManager's pooled holdings.
 * - uniswap-v4    — v4 is a singleton, so no per-pool balance exists. Active liquidity at the current
 *   tick is the closest per-pool measure, and it is what drops when an LP pulls out.
 */
export type PoolSource =
	| { kind: "erc20-balance", holder: address, token: address }
	| { kind: "uniswap-v4", poolId: string }

// v4 keeps pool state in transient/packed storage; StateView is the canonical read-only accessor for it.
const UNISWAP_V4_STATE_VIEW = "0x7fFE42C4a5DEeA5b0feC41C94C136Cf115597227"

const stateViewAbi = ["function getLiquidity(bytes32 poolId) view returns (uint128)"] as const
const erc20Abi = [
	"function balanceOf(address) view returns (uint256)",
	"function decimals() view returns (uint8)",
] as const

// Decimals never change for a deployed token, so one lookup per token per process is enough. Reading
// them on-chain rather than from a table keeps this working for any pool added to the watch list.
const decimalsCache = new Map<string, Promise<number>>()

function getDecimals(runner: ContractRunner, token: address): Promise<number> {
	const key = token.toLowerCase()
	let cached = decimalsCache.get(key)
	if (cached === undefined) {
		// Evict on failure. Caching the promise rather than the value is what makes concurrent callers
		// share one request, but it also means a rejection would otherwise be cached forever — and since
		// this runs inside a long-lived cron process, one timed-out call would blind the token's metric
		// until the next restart.
		cached = new Contract(token, erc20Abi, runner).decimals().then(Number).catch(e => {
			decimalsCache.delete(key)
			throw e
		})
		decimalsCache.set(key, cached)
	}
	return cached
}

/**
 * Depth of one hop of a swap route.
 *
 * Reported so that movement is visible rather than only exhaustion: the venues carrying most of an exit
 * are typically far too deep to run dry, but a large withdrawal from one is an early sign that the route
 * is about to reprice, and it shows up here well before a quote gets worse.
 */
export async function getPoolLiquidity(runner: ContractRunner, source: PoolSource): Promise<number> {
	if (source.kind === "uniswap-v4") {
		const stateView = new Contract(UNISWAP_V4_STATE_VIEW, stateViewAbi, runner)
		// Not a token amount and not comparable between pools — only its own history is meaningful.
		return Number(await stateView.getLiquidity(source.poolId))
	}

	const [balance, decimals] = await Promise.all([
		new Contract(source.token, erc20Abi, runner).balanceOf(source.holder) as Promise<bigint>,
		getDecimals(runner, source.token),
	])
	return Number(balance) / 10 ** decimals
}
