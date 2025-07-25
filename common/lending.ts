import { StrategyExecutor } from "./calculate-result"
import { address } from "./types"
import { InnerStrategyOperation } from "./serialize-operation"

export interface Lending {
	initDeposit(ex: StrategyExecutor<any>): Promise<Deposit>

	initWithdraw(ex: StrategyExecutor<any>, share: number): Promise<Withdraw>
}

export interface Deposit {
	debt: address
	collateral: address

	getSupplyOperation(amount: bigint): InnerStrategyOperation

	getBorrowOperation(amount: bigint): InnerStrategyOperation
}

export interface Withdraw {
	debt: address
	collateral: address
	totalDebt: bigint
	totalCollateral: bigint
	debtToRepay: bigint
	collateralToWithdraw: bigint
	repayOperation: InnerStrategyOperation
	withdrawOperation: InnerStrategyOperation

	getHealthFactor(): Promise<number>
}

async function refinance<T>(
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
		return ex.execute([
			{
				type: "morpho-flash-loan",
				token: debt,
				amount: debtToRepay,
				innerOperations: [
					repayOperation,
					withdrawOperation,
					getSupplyOperation(collateralToWithdraw),
					getBorrowOperation(debtToRepay), //todo calc how much to borrow
					{
						type: "swap",
						from: newDebt,
						to: debt,
						amount: debtToRepay, //todo need to swap all new debt into old
					}
				]
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