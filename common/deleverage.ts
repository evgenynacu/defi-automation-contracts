import { StrategyExecutor } from "./calculate-result"
import { Lending } from "./lending"
import { calculateAmountToSwap } from "./calculate-amount-to-swap"
import { MaxUint256 } from "ethers"

export async function deleverage<T>(ex: StrategyExecutor<T>, lending: Lending, share: number) {
	const inst = await lending.initWithdraw(ex, share)
	const { debt, collateral, debtToRepay, repayOperation, getWithdrawOperation } = inst

	const m = 100000n
	const collateralToWithdraw = (await calculateAmountToSwap(collateral, debt, debtToRepay)) * (m + 1n) / m
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
		{
			type: "erc20-transfer-to-caller",
			token: debt,
			amount: MaxUint256,
		}
	])
}