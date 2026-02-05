import { StrategyExecutor } from "./calculate-result"
import { Lending } from "./lending"
import { MaxUint256 } from "ethers"
import { calculateAmountToSwap } from "./calculate-amount-to-swap"

export async function refinance<T>(
	ex: StrategyExecutor<T>,
	from: Lending,
	to: Lending,
	debtShare: number,
	collateralShare: number = debtShare,
	multiplier: bigint = 100000n
) {

	const txOrigin = await ex.getFrom()

	const {
		debt,
		collateral,
		debtToRepay,
		collateralToWithdraw,
		repayOperation,
		getWithdrawOperation
	} = await from.initWithdraw(ex, debtShare, collateralShare)

	const { debt: newDebt, collateral: newCollateral, getSupplyOperation, getBorrowOperation } = await to.initDeposit(ex)
	if (collateral.toLowerCase() !== newCollateral.toLowerCase()) {
		if (debt.toLowerCase() !== newDebt.toLowerCase()) {
			throw new Error("Collateral must be the same")
		}

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
						to: newCollateral,
						amount: collateralToWithdraw,
						txOrigin: txOrigin,
					},
					getSupplyOperation(MaxUint256),
					getBorrowOperation(debtToRepay),
				]
			},
			{
				type: "erc20-transfer-to",
				token: debt,
				amount: MaxUint256,
				to: txOrigin,
			}
		])
	}

	if (debt.toLowerCase() !== newDebt.toLowerCase()) {
		console.log("refinancing using debt swap")
		const newDebtAmount = (await calculateAmountToSwap(newDebt, debt, debtToRepay)) * (multiplier + 1n) / multiplier
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
						txOrigin: txOrigin,
					}
				]
			},
			{
				type: "erc20-transfer-to",
				token: debt,
				amount: MaxUint256,
				to: txOrigin,
			}
		])
	} else {
		console.log("refinancing. no debt swap is needed")
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
