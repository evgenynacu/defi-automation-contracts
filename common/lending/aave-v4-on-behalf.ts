import { Deposit, Lending, Withdraw } from "../lending"
import { address } from "../types"
import { StrategyExecutor } from "../calculate-result"
import { ISpoke__factory } from "../../typechain-types"
import { getReserveId } from "../aave-v4/get-reserve-id"
import { getAaveV4HealthFactor } from "../get-aave-v4-health-factor"
import { AaveV4Leg } from "../aave-v4/types"

/**
 * Aave v4 position owned by someone other than the vault.
 *
 * Mirrors AaveV4, but every operation names the owner and routes through Aave's position managers.
 * The owner must have granted the vault the permissions in common/approve-aave-v4-on-behalf.ts first.
 */
export class AaveV4OnBehalf implements Lending {
	constructor(
		readonly spoke: address,
		readonly collateralLeg: AaveV4Leg,
		readonly debtLeg: AaveV4Leg,
		readonly onBehalfOf?: address,
	) {
	}

	get collateral(): address {
		return this.collateralLeg.token
	}

	get debt(): address {
		return this.debtLeg.token
	}

	private async resolve(ex: StrategyExecutor<any>) {
		const [collateralReserveId, debtReserveId] = await Promise.all([
			getReserveId(ex.runner, this.spoke, this.collateralLeg.hub, this.collateralLeg.token),
			getReserveId(ex.runner, this.spoke, this.debtLeg.hub, this.debtLeg.token),
		])
		return { collateralReserveId, debtReserveId, owner: this.onBehalfOf || await ex.getFrom() }
	}

	async initDeposit(ex: StrategyExecutor<any>): Promise<Deposit> {
		const { collateralReserveId, debtReserveId, owner } = await this.resolve(ex)
		const spoke = this.spoke

		return {
			debt: this.debt,
			collateral: this.collateral,
			getSupplyOperation: (amount: bigint) => ({
				type: "aave-v4-ob-supply",
				spoke,
				reserveId: collateralReserveId,
				amount,
				onBehalfOf: owner,
			}),
			getBorrowOperation: (amount: bigint) => ({
				type: "aave-v4-ob-borrow",
				spoke,
				reserveId: debtReserveId,
				amount,
				onBehalfOf: owner,
			}),
		}
	}

	async initWithdraw(ex: StrategyExecutor<any>, debtShare: number, collateralShare: number): Promise<Withdraw> {
		const { collateralReserveId, debtReserveId, owner } = await this.resolve(ex)
		const spoke = this.spoke
		const contract = ISpoke__factory.connect(spoke, ex.runner)

		const [totalDebt, totalCollateral] = await Promise.all([
			contract.getUserTotalDebt(debtReserveId, owner),
			contract.getUserSuppliedAssets(collateralReserveId, owner),
		])

		// debt keeps accruing between quoting and execution, so round the repay leg up. The giver clamps
		// to the outstanding debt, so over-quoting cannot over-pay.
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
				type: "aave-v4-ob-repay",
				spoke,
				reserveId: debtReserveId,
				amount: debtToRepay,
				onBehalfOf: owner,
			},
			getWithdrawOperation: (amount: bigint) => ({
				type: "aave-v4-ob-withdraw",
				spoke,
				reserveId: collateralReserveId,
				amount,
				onBehalfOf: owner,
			}),
			getHealthFactor: async () => {
				const { result } = await getAaveV4HealthFactor(ex.runner, spoke, owner)
				return result
			},
		}
	}

	/** One-time setup: v4 does not enable collateral on supply. Requires canSetUsingAsCollateral. */
	async initCollateralOperations(ex: StrategyExecutor<any>, use: boolean = true) {
		const { collateralReserveId, owner } = await this.resolve(ex)
		return [{
			type: "aave-v4-ob-set-collateral" as const,
			spoke: this.spoke,
			reserveId: collateralReserveId,
			use,
			onBehalfOf: owner,
		}]
	}
}

const multiplier = 10000000
