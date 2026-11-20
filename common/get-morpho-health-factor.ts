import { type BlockTag, type ContractRunner } from "ethers"
import { address } from "./types"
import { MorphoBlue__factory, MorphoOracle__factory } from "../typechain-types"
import { getMorphoBlue } from "./get-morpho-blue"

const WAD = 10n ** 18n
// Morpho oracles quote collateral in loan-token units scaled by 1e36, which already absorbs the two
// tokens' decimals. Working in that scale is why this needs no decimals lookup — and so it is immune
// to getDecimals() guessing 18 for anything not in its hard-coded list, as it does for WBTC.
const ORACLE_SCALE = 10n ** 36n
// Enough precision for a health factor without reaching for floats inside the ratio.
const PRECISION = 1_000_000n

/**
 * Health factor of one account's position on a Morpho Blue market, read straight from chain state.
 *
 * Deliberately not the unwind simulation that `morpho-withdraw` runs: that answers "what would I get
 * out", needs the vault authorised and a working swap route, and fails outright when no route quotes.
 * This answers only "how close to liquidation", from the position, the market and the oracle, so it
 * keeps reporting when the exit path is broken — which is exactly when the number matters most.
 *
 * Returns Infinity for a position with collateral and no debt, since nothing can liquidate it.
 */
export async function getMorphoHealthFactor(
	runner: ContractRunner,
	marketId: string,
	owner: address,
	blockTag: BlockTag = "latest",
) {
	const { chainId } = await runner.provider!.getNetwork()
	const morpho = MorphoBlue__factory.connect(getMorphoBlue(chainId), runner)

	const [params, market, position] = await Promise.all([
		morpho.idToMarketParams(marketId, { blockTag }),
		morpho.market(marketId, { blockTag }),
		morpho.position(marketId, owner, { blockTag }),
	])
	const price = await MorphoOracle__factory.connect(params.oracle, runner).price({ blockTag })

	// Borrow shares, not assets: debt accrues into the share price, so converting through the market
	// totals is the only way to see interest that has not been realised by an interaction yet. It still
	// trails by whatever has accrued since the market's last touch, which flatters the health factor by
	// around 1e-4 after a day — far below anything worth acting on, and in the same direction as the
	// existing withdraw path.
	const debt = market.totalBorrowShares === 0n
		? 0n
		: position.borrowShares * market.totalBorrowAssets / market.totalBorrowShares
	const collateralValue = position.collateral * price / ORACLE_SCALE

	const lltv = Number(params.lltv * PRECISION / WAD) / Number(PRECISION)
	// Collateral worth nothing while debt is outstanding — a zeroed oracle, say — is infinite LTV, not
	// zero. Collapsing both to zero would report the safest possible health factor for the single most
	// dangerous state there is.
	const ltv = collateralValue === 0n
		? (debt === 0n ? 0 : Number.POSITIVE_INFINITY)
		: Number(debt * PRECISION / collateralValue) / Number(PRECISION)

	return {
		id: `morpho-health-factor-${marketId}-${owner}`,
		// Only a debt-free position is unliquidatable; everything else divides, and an infinite LTV
		// correctly falls out as zero.
		result: debt === 0n ? Number.POSITIVE_INFINITY : lltv / ltv,
		// Fractions, not percentages: ltvGauge has carried 0-1 since it was introduced, and mixing
		// scales in one gauge would silently break any panel or alert calibrated against it.
		ltv,
		lltv,
		collateralValue: collateralValue.toString(),
		debt: debt.toString(),
	}
}
