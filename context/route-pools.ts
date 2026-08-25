import { toAddress } from "../common/types"
import { PoolSource } from "../common/get-pool-liquidity"
import { USDC, USDT_ADDRESS } from "../common/addresses"

/**
 * The venues the sUSDS -> USDT exit actually routes through, as reported by the aggregator.
 *
 * The route is a funnel rather than a set of alternatives. sUSDS redeems to USDS on the sUSDS contract
 * itself (no pool, no counterparty, so nothing to watch), and everything below is what the USDS has to
 * pass through to come out as USDT:
 *
 *   stage-2  USDS -> USDC via the Sky PSM, or USDS -> USDT directly on Uniswap v4
 *   stage-3  USDC -> USDT, spread across whichever venues are quoting
 *
 * Stage 3 also fills from off-chain RFQ market makers, which hold no on-chain reserves and cannot be
 * watched here. That is a price risk rather than an exit risk: quoted at eight times the current
 * position the route still clears within about a basis point, which is the on-chain venues below
 * absorbing the whole size on their own.
 */
export type WatchedPool = {
	/**
	 * Which hop of the route this venue serves.
	 *
	 * "shared" is for inventory that backs more than one hop at once, which would be misreported under
	 * either stage alone. Duplicating the entry across stages is not the alternative: the two rows would
	 * be the same balance counted twice, and any dashboard summing by stage would double it.
	 */
	stage: "stage-2" | "stage-3" | "shared"
	venue: string
	source: PoolSource
}

// Sky's lite-PSM swaps USDS for USDC one-for-one with both fees set to zero, and holds the USDC in a
// separate pocket rather than on the PSM itself. The pocket is the balance that backs the swap.
const SKY_PSM_POCKET = toAddress("0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341")

// v4 is a singleton: every pool's tokens sit on the PoolManager, so this balance is the ceiling for
// all v4 hops combined, while each pool's own getLiquidity covers its individual depth.
const UNISWAP_V4_POOL_MANAGER = toAddress("0x000000000004444c5dc75cB358380D2e3dE08A90")

const CURVE_STABLE_NG_USDC_USDT = toAddress("0x4f493b7de8aac7d55f71853688b1f7c8f0243c85")
const LISTA_STABLE_USDC_USDT = toAddress("0x35c9a4dae1ff05788f24b5b32721d89340cbb636")

// Pool ids, not addresses — v4 pools have no address of their own. Suffixed with the id prefix because
// the two USDC/USDT pools differ only by fee tier and would otherwise be indistinguishable as labels.
const POOL_ID_USDS_USDT = "0x3b1b1f2e775a6db1664f8e7d59ad568605ea2406312c11aef03146c0cf89d5b9"
const POOL_ID_USDC_USDT_0FB0E4 = "0x0fb0e40cec3bb23e13abc585958a93c796fbea56955e19a23727a716a0423239"
const POOL_ID_USDC_USDT_8AA4E1 = "0x8aa4e11cbdf30eedc92100f4c8a31ff748e201d44712cc8c90d189edaa8e4e47"

export const SUSDS_USDT_ROUTE_POOLS: WatchedPool[] = [
	// stage 2 — where the USDS goes. The PSM carries most of the flow.
	{
		stage: "stage-2",
		venue: "sky-lite-psm",
		source: { kind: "erc20-balance", holder: SKY_PSM_POCKET, token: USDC },
	},
	{
		stage: "stage-2",
		venue: "uniswap-v4-usds-usdt",
		source: { kind: "uniswap-v4", poolId: POOL_ID_USDS_USDT },
	},

	// stage 3 — USDC -> USDT.
	// Not a hop of its own. Every v4 pool's tokens sit on the singleton, so this USDT is the ceiling the
	// stage-2 USDS -> USDT pool and the stage-3 USDC -> USDT pools all draw from at once — filed under
	// either stage alone, a drop in it would be invisible to the other.
	{
		stage: "shared",
		venue: "uniswap-v4-pool-manager",
		source: { kind: "erc20-balance", holder: UNISWAP_V4_POOL_MANAGER, token: USDC },
	},
	{
		stage: "shared",
		venue: "uniswap-v4-pool-manager",
		source: { kind: "erc20-balance", holder: UNISWAP_V4_POOL_MANAGER, token: toAddress(USDT_ADDRESS) },
	},
	{
		stage: "stage-3",
		venue: "uniswap-v4-usdc-usdt-0fb0e4",
		source: { kind: "uniswap-v4", poolId: POOL_ID_USDC_USDT_0FB0E4 },
	},
	{
		stage: "stage-3",
		venue: "uniswap-v4-usdc-usdt-8aa4e1",
		source: { kind: "uniswap-v4", poolId: POOL_ID_USDC_USDT_8AA4E1 },
	},
	{
		stage: "stage-3",
		venue: "curve-stable-ng-usdc-usdt",
		source: { kind: "erc20-balance", holder: CURVE_STABLE_NG_USDC_USDT, token: USDC },
	},
	{
		stage: "stage-3",
		venue: "curve-stable-ng-usdc-usdt",
		source: { kind: "erc20-balance", holder: CURVE_STABLE_NG_USDC_USDT, token: toAddress(USDT_ADDRESS) },
	},
	{
		stage: "stage-3",
		venue: "lista-stable-usdc-usdt",
		source: { kind: "erc20-balance", holder: LISTA_STABLE_USDC_USDT, token: USDC },
	},
	{
		stage: "stage-3",
		venue: "lista-stable-usdc-usdt",
		source: { kind: "erc20-balance", holder: LISTA_STABLE_USDC_USDT, token: toAddress(USDT_ADDRESS) },
	},
	// Fluid's DEX is deliberately absent: it holds no reserves on the pool contract, so balanceOf reads
	// zero and a real number needs their resolver. It carried about 5% of the route when last measured.
]
