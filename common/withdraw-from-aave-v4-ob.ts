import { StrategyExecutor } from "./calculate-result"
import { withdraw } from "./withdraw"
import { AaveV4OnBehalf } from "./lending/aave-v4-on-behalf"
import { AaveV4Leg } from "./aave-v4/types"
import { address } from "./types"

export type AaveV4WithdrawOptions = {
	debtShare?: number
	collateralShare?: number
	/** position owner; defaults to the executor's sender */
	onBehalfOf?: address
	flashLoanProvider?: "insta" | "morpho"
}

/**
 * Withdraw from an Aave v4 position the vault manages on someone's behalf.
 *
 * Shares default to 1, i.e. a full exit. The optional tail is an object rather than positional
 * arguments because the v4 variant needs the spoke and a hub per leg, and callers otherwise have to
 * pad with `undefined` to reach flashLoanProvider.
 */
export async function withdrawFromAaveV4OnBehalf<T>(
	ex: StrategyExecutor<T>,
	spoke: address,
	collateral: AaveV4Leg,
	debt: AaveV4Leg,
	{ debtShare = 1, collateralShare, onBehalfOf, flashLoanProvider }: AaveV4WithdrawOptions = {},
): Promise<T> {
	return withdraw({
		ex,
		lending: new AaveV4OnBehalf(spoke, collateral, debt, onBehalfOf),
		debtShare,
		collateralShare,
		flashLoanProvider,
	})
}
