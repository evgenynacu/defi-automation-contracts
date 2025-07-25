import { Deposit, Lending, Withdraw } from "../lending"
import { address } from "../types"
import { StrategyExecutor } from "../calculate-result"
import { IPoolDataProvider__factory } from "../../typechain-types"
import { AAVE_DATA_PROVIDER } from "../addresses"
import { getAaveHealthFactor } from "../get-aave-health-factor"

export class Aave implements Lending {
	constructor(
		readonly collateral: address,
		readonly debt: address,
	) {
	}

	async initDeposit(_ex: StrategyExecutor<any>): Promise<Deposit> {
		return {
			debt: this.debt,
			collateral: this.collateral,
			getSupplyOperation: (amount: bigint) => ({
				type: "aave-supply",
				token: this.collateral,
				amount,
			}),
			getBorrowOperation: (amount: bigint) => ({
				type: "aave-borrow",
				token: this.debt,
				amount,
			}),
		}
	}

	async initWithdraw(ex: StrategyExecutor<any>, share: number): Promise<Withdraw> {
		const data = IPoolDataProvider__factory.connect(AAVE_DATA_PROVIDER, ex.runner)
		const vault = await ex.getVaultAddress()

		const [, , totalDebt] = await data.getUserReserveData(this.debt, vault)
		const [totalCollateral] = await data.getUserReserveData(this.collateral, vault)
		const debtToRepay = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
		const collateralToWithdraw = totalCollateral * BigInt(share * multiplier) / BigInt(multiplier)

		return {
			debt: this.debt,
			collateral: this.collateral,
			totalDebt,
			totalCollateral,
			debtToRepay,
			collateralToWithdraw,
			repayOperation: {
				type: "aave-repay",
				token: this.debt,
				amount: debtToRepay,
			},
			withdrawOperation: {
				type: "aave-withdraw",
				token: this.collateral,
				amount: collateralToWithdraw,
			},
			getHealthFactor: async () => {
				const { result } = await getAaveHealthFactor(ex.runner, await ex.getVaultAddress())
				return result
			},
		}
	}
}

const multiplier = 10000000