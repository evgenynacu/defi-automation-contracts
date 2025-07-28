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

	getWithdrawOperation(amount: bigint): InnerStrategyOperation

	getHealthFactor(): Promise<number>
}