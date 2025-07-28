import { StrategyExecutor } from "./calculate-result"
import { Lending } from "./lending"
import { MaxUint256 } from "ethers"
import { calculateAmountToSwap } from "./calculate-amount-to-swap"

export async function refinance<T>(
	ex: StrategyExecutor<T>,
	from: Lending,
	to: Lending,
	share: number,
) {

	const {
		debt,
		collateral,
		debtToRepay,
		collateralToWithdraw,
		repayOperation,
		getWithdrawOperation
	} = await from.initWithdraw(ex, share)

	const { debt: newDebt, collateral: newCollateral, getSupplyOperation, getBorrowOperation } = await to.initDeposit(ex)
	if (collateral.toLowerCase() !== newCollateral.toLowerCase()) {
		throw new Error("Collateral must be the same")
	}

	if (debt.toLowerCase() !== newDebt.toLowerCase()) {
		const newDebtAmount = await calculateAmountToSwap(newDebt, debt, debtToRepay)
		console.log("newDebtAmount", newDebtAmount, "debtToRepay", debtToRepay)

		return ex.execute([
			{
				type: "morpho-flash-loan",
				token: debt,
				amount: debtToRepay,
				innerOperations: [
					repayOperation,
					getWithdrawOperation(collateralToWithdraw),
					getSupplyOperation(collateralToWithdraw),
					getBorrowOperation(newDebtAmount),
					{
						type: "swap",
						from: newDebt,
						to: debt,
						amount: newDebtAmount,
					}
				]
			},
			{
				type: "erc20-transfer-to-caller",
				token: debt,
				amount: MaxUint256,
			}
		])
	} else {
		return ex.execute([
			{
				type: "morpho-flash-loan",
				token: debt,
				amount: debtToRepay,
				innerOperations: [
					repayOperation,
					getWithdrawOperation(collateralToWithdraw),
					getSupplyOperation(collateralToWithdraw),
					getBorrowOperation(debtToRepay),
				]
			}
		])
	}
}
