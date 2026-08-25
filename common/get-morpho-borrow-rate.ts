import { Contract, type ContractRunner } from "ethers"
import { MorphoBlue__factory } from "../typechain-types"
import { getMorphoBlue } from "./get-morpho-blue"

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

/**
 * borrowRateView is the only thing needed from the IRM, and it is a pure view, so it goes inline
 * rather than vendoring a whole contract. The tuples mirror MorphoBlue.MarketParams and .Market.
 */
const irmAbi = [
	"function borrowRateView((address,address,address,address,uint256),(uint128,uint128,uint128,uint128,uint128,uint128)) view returns (uint256)",
] as const

/**
 * Current borrow rate on a Morpho Blue market.
 *
 * Morpho's IRM returns a per-second rate scaled by 1e18, and interest compounds continuously, so the
 * effective yearly cost is exp(apr) - 1 rather than the APR itself. At the rates these markets run
 * that gap is only a few basis points, but a levered position pays it on the whole debt, not on equity.
 *
 * borrowRateView, unlike borrowRate, does not write, which is what lets this run against a plain
 * provider. It prices the market as of its last accrual, so the number moves with utilization.
 */
export async function getMorphoBorrowRate(runner: ContractRunner, marketId: string) {
	const { chainId } = await runner.provider!.getNetwork()
	const morpho = MorphoBlue__factory.connect(getMorphoBlue(chainId), runner)
	const [params, market] = await Promise.all([
		morpho.idToMarketParams(marketId),
		morpho.market(marketId),
	])

	const irm = new Contract(params.irm, irmAbi, runner)
	const ratePerSecond: bigint = await irm.borrowRateView(
		[params.loanToken, params.collateralToken, params.oracle, params.irm, params.lltv],
		[
			market.totalSupplyAssets,
			market.totalSupplyShares,
			market.totalBorrowAssets,
			market.totalBorrowShares,
			market.lastUpdate,
			market.fee,
		],
	)

	const apr = Number(ratePerSecond) / 1e18 * SECONDS_PER_YEAR
	const borrowApy = Math.exp(apr) - 1
	const utilization = market.totalSupplyAssets === 0n
		? 0
		: Number(market.totalBorrowAssets) / Number(market.totalSupplyAssets)
	// What lenders receive: borrowers' interest spread over all supply, less the market fee.
	const supplyApy = borrowApy * utilization * (1 - Number(market.fee) / 1e18)

	return {
		id: `morpho-borrow-rate-${marketId}`,
		result: borrowApy * 100,
		borrowApr: apr * 100,
		supplyApy: supplyApy * 100,
		utilization: utilization * 100,
		totalSupplyAssets: market.totalSupplyAssets.toString(),
		totalBorrowAssets: market.totalBorrowAssets.toString(),
	}
}
