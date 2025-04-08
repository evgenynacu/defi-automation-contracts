import { MORPHO_BLUE } from "../deploy/addresses"
import { StrategyExecutor } from "./calculate-result"
import { MorphoBlue__factory } from "../typechain-types"
import { MaxUint256 } from "ethers"

const multiplier = 1000000

/**
 * Withdraw part of the morpho position
 * @param ex executor
 * @param marketId
 * @param share number from 0 to 1 (part of the position to withdraw)
 */
export async function withdrawFromMorpho<T>(ex: StrategyExecutor<T>, marketId: string, share: number): Promise<T> {
	const from = await ex.getFrom()

	const morpho = MorphoBlue__factory.connect(MORPHO_BLUE, ex.runner)
	const params = await morpho.idToMarketParams(marketId)
	const market = await morpho.market(marketId)
	const pos = await morpho.position(marketId, from)

	const totalCollateral = pos.collateral
	const totalDebt = pos.borrowShares * market.totalBorrowAssets / market.totalBorrowShares

	console.log("total collateral: ", totalCollateral, "total debt: ", totalDebt)

	const approxDebtToWithdraw = totalDebt * BigInt(share * multiplier + 1000) / BigInt(multiplier)
	const debtSharesToWithdraw = pos.borrowShares * BigInt(share * multiplier) / BigInt(multiplier)
	const collateralToWithdraw = totalCollateral * BigInt(share * multiplier) / BigInt(multiplier)

	console.log("debt shares to withdraw: ", debtSharesToWithdraw, "collateral to withdraw: ", collateralToWithdraw)

	return ex.execute([
		{
			type: "morpho-flash-loan",
			token: params.loanToken,
			amount: approxDebtToWithdraw,
			innerOperations: [
				{
					type: "morpho-repay",
					marketId: marketId,
					assets: 0n,
					shares: debtSharesToWithdraw,
				},
				{
					type: "morpho-withdraw",
					marketId: marketId,
					amount: collateralToWithdraw,
				},
				{
					type: "swap",
					from: params.collateralToken,
					to: params.loanToken,
					amount: collateralToWithdraw,
				},
			]
		},
		{
			type: "erc20-transfer-to-caller",
			token: params.loanToken,
			amount: MaxUint256
		}
	])
}
