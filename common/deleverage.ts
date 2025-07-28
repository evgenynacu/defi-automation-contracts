import { StrategyExecutor } from "./calculate-result"
import { Lending } from "./lending"
import { calculateAmountToSwap } from "./calculate-amount-to-swap"

export async function deleverage<T>(ex: StrategyExecutor<T>, lending: Lending, share: number) {
	const inst = await lending.initWithdraw(ex, share)
	const { debt, collateral, debtToRepay, repayOperation, getWithdrawOperation } = inst

	const collateralToWithdraw = await calculateAmountToSwap(collateral, debt, debtToRepay)
	console.log(`deleverage collateral: ${collateralToWithdraw}`, "debt: ", debtToRepay)
	return ex.execute([
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
				},
			]
		},

	])
}