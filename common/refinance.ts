import { StrategyExecutor } from "./calculate-result"
import { Lending } from "./lending"
import { address } from "./types"
import { getDecimals } from "./decimals"
import { testSwap } from "./test-swap"
import { MaxUint256 } from "ethers"

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
		withdrawOperation
	} = await from.initWithdraw(ex, share)

	const { debt: newDebt, collateral: newCollateral, getSupplyOperation, getBorrowOperation } = await to.initDeposit(ex)
	if (collateral.toLowerCase() !== newCollateral.toLowerCase()) {
		throw new Error("Collateral must be the same")
	}

	if (debt.toLowerCase() !== newDebt.toLowerCase()) {
		const newDebtAmount = await getNeedAmountToSwap(newDebt, debt, debtToRepay)
		console.log("newDebtAmount", newDebtAmount, "debtToRepay", debtToRepay)

		return ex.execute([
			{
				type: "morpho-flash-loan",
				token: debt,
				amount: debtToRepay,
				innerOperations: [
					repayOperation,
					withdrawOperation,
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
					withdrawOperation,
					getSupplyOperation(collateralToWithdraw),
					getBorrowOperation(debtToRepay),
				]
			}
		])
	}
}

async function getNeedAmountToSwap(from: address, to: address, toAmount: bigint): Promise<bigint> {
	const toAmountNumber = Number(toAmount) / (10 ** getDecimals(to))
	const fromAmount = BigInt(Math.floor(toAmountNumber * 10 ** getDecimals(from)))
	const testAmount = await testSwap(from, fromAmount, to)
	// proportion
	// fromAmount => testAmount
	// x => toAmount
	// x = fromAmount * toAmount / testAmount
	const m = 10000000n
	return  (m + 1n) * fromAmount * toAmount / (testAmount * m)
}