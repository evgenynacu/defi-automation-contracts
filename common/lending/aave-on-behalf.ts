import { Deposit, Lending, Withdraw } from "../lending"
import { address } from "../types"
import { StrategyExecutor } from "../calculate-result"
import { IPoolDataProvider__factory } from "../../typechain-types"
import { getAaveDataProvider } from "../get-aave-addresses"
import { getAaveHealthFactor } from "../get-aave-health-factor"

export class AaveOnBehalf implements Lending {
	constructor(
		readonly collateral: address,
		readonly debt: address,
		readonly onBehalfOf?: address,
	) {
	}

	async initDeposit(ex: StrategyExecutor<any>): Promise<Deposit> {
		const onBehalfOf = this.onBehalfOf || await ex.getFrom()
		return {
			debt: this.debt,
			collateral: this.collateral,
			getSupplyOperation: (amount: bigint) => ({
				type: "aave-ob-supply",
				token: this.collateral,
				amount,
				onBehalfOf,
			}),
			getBorrowOperation: (amount: bigint) => ({
				type: "aave-ob-borrow",
				token: this.debt,
				amount,
				onBehalfOf,
			}),
		}
	}

	async initWithdraw(ex: StrategyExecutor<any>, debtShare: number, collateralShare: number): Promise<Withdraw> {
		const onBehalfOf = this.onBehalfOf || await ex.getFrom()
		const { chainId } = await ex.runner.provider!.getNetwork()
		const data = IPoolDataProvider__factory.connect(getAaveDataProvider(chainId), ex.runner)

		if (process.env.DEBUG) {
			console.log("data is", await data.getAddress())
		}
		const [, , totalDebt] = await data.getUserReserveData(this.debt, onBehalfOf)
		const [totalCollateral] = await data.getUserReserveData(this.collateral, onBehalfOf)
		const debtToRepay = totalDebt * BigInt(Math.floor(debtShare * multiplier + 1)) / BigInt(multiplier)
		const collateralToWithdraw = totalCollateral * BigInt(Math.floor(collateralShare * multiplier)) / BigInt(multiplier)

		return {
			debt: this.debt,
			collateral: this.collateral,
			totalDebt,
			totalCollateral,
			debtToRepay,
			collateralToWithdraw,
			repayOperation: {
				type: "aave-ob-repay",
				token: this.debt,
				amount: debtToRepay,
				onBehalfOf,
			},
			getWithdrawOperation: (amount: bigint) => ({
				type: "aave-ob-withdraw",
				token: this.collateral,
				amount,
				onBehalfOf,
			}),
			getHealthFactor: async () => {
				const { result } = await getAaveHealthFactor(ex.runner, onBehalfOf)
				return result
			},
		}
	}
}


const multiplier = 10000000
