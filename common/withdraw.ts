import { StrategyExecutor } from "./calculate-result"
import { MaxUint256 } from "ethers"
import { getDecimals } from "./decimals"
import { Lending } from "./lending"


export async function withdraw<T>(
	ex: StrategyExecutor<T>,
	lending: Lending,
	share: number
): Promise<T> {

	const from = await ex.getFrom()

	const {
		debt,
		collateral,
		totalDebt,
		totalCollateral,
		debtToRepay,
		repayOperation,
		getWithdrawOperation,
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
				getWithdrawOperation(collateralToWithdraw),
				{
					type: "swap",
					from: collateral,
					to: debt,
					amount: collateralToWithdraw,
					txOrigin: from,
				},
			]
		},
		{
			type: "erc20-transfer-to",
			token: debt,
			amount: MaxUint256,
			to: from,
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
