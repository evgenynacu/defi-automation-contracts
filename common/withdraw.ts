import { StrategyExecutor } from "./calculate-result"
import { MaxUint256 } from "ethers"
import { getDecimals } from "./decimals"
import { Lending } from "./lending"


export async function withdraw<T>(
	ex: StrategyExecutor<T>,
	lending: Lending,
	share: number
): Promise<T> {

	const {
		debt,
		collateral,
		totalDebt,
		totalCollateral,
		debtToRepay,
		repayOperation,
		withdrawOperation,
		collateralToWithdraw,
		getHealthFactor,
	} = await lending.initWithdraw(ex, share)

	const result = await ex.execute([
		{
			type: "morpho-flash-loan",
			token: debt,
			amount: debtToRepay,
			innerOperations: [
				repayOperation,
				withdrawOperation,
				{
					type: "swap",
					from: collateral,
					to: debt,
					amount: collateralToWithdraw,
				},
			]
		},
		{
			type: "erc20-transfer-to-caller",
			token: debt,
			amount: MaxUint256
		}
	])
	const hf = await getHealthFactor()
	return {
		...result,
		hf,
		debt: Number(totalDebt) / (10 ** getDecimals(debt)),
		collateral: Number(totalCollateral) / (10 ** getDecimals(collateral)),
	}
}
