import { Deposit, Lending, Withdraw } from "../lending"
import { MorphoBlue, MorphoBlue__factory, MorphoOracle__factory } from "../../typechain-types"
import { createCalculateExecutor, StrategyExecutor } from "../calculate-result"
import { MORPHO_BLUE } from "../addresses"
import { address, toAddress } from "../types"
import { getBalanceStorageSlot } from "../test-swap"

export class Morpho implements Lending {
	private morpho: MorphoBlue | undefined

	constructor(
		readonly marketId: string,
	) {
	}

	async initDeposit(ex: StrategyExecutor<any>): Promise<Deposit> {
		this.morpho = MorphoBlue__factory.connect(MORPHO_BLUE, ex.runner)
		const [debt, collateral] = await this.morpho.idToMarketParams(this.marketId)
		return {
			debt: toAddress(debt),
			collateral: toAddress(collateral),
			getSupplyOperation: (amount: bigint) => ({
				type: "morpho-supply",
				marketId: this.marketId,
				amount,
			}),
			getBorrowOperation: (amount: bigint) => ({
				type: "morpho-borrow",
				marketId: this.marketId,
				amount,
			}),
		}
	}

	async initWithdraw(ex: StrategyExecutor<any>, share: number): Promise<Withdraw> {
		const from = await ex.getFrom()
		const morpho = MorphoBlue__factory.connect(MORPHO_BLUE, ex.runner)
		const params = await morpho.idToMarketParams(this.marketId)
		const market = await morpho.market(this.marketId)
		const pos = await morpho.position(this.marketId, from)
		const totalBorrowAssets = await getTotalBorrowAssets(ex, this.marketId, toAddress(params.loanToken))

		const totalCollateral = pos.collateral
		const totalDebt = pos.borrowShares * totalBorrowAssets / market.totalBorrowShares

		const debtToRepay = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
		const debtSharesToRepay = pos.borrowShares * BigInt(share * multiplier) / BigInt(multiplier)
		const collateralToWithdraw = totalCollateral * BigInt(share * multiplier) / BigInt(multiplier)

		return {
			debt: toAddress(params.loanToken),
			collateral: toAddress(params.collateralToken),
			totalDebt,
			totalCollateral,
			debtToRepay: debtToRepay,
			collateralToWithdraw: collateralToWithdraw,
			repayOperation: {
				type: "morpho-repay",
				marketId: this.marketId,
				assets: 0n,
				shares: debtSharesToRepay,
			},
			getWithdrawOperation: (amount: bigint) => ({
				type: "morpho-withdraw",
				marketId: this.marketId,
				amount,
			}),
			getHealthFactor: async () => {
				const oracle = MorphoOracle__factory.connect(params.oracle, ex.runner)
				const price = await oracle.price()

				const ltv = Number(totalDebt * 1000000n / (totalCollateral * price / 10n ** 36n)) / 1000000
				const lltv = Number(1000000n * params.lltv / 10n ** 18n) / 1000000
				return lltv / ltv
			}
		}
	}
}

async function getTotalBorrowAssets(ex: StrategyExecutor<any>, marketId: string, loanToken: address) {
	const calc = createCalculateExecutor(ex.runner, "0x5Af8B1e9b34de89a07f6114c2ffB3bABaEdca240", "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E", {
		[loanToken]: {
			stateDiff: {
				[getBalanceStorageSlot(loanToken)]: "0x000000000000000000000000000ff00000000000000000006404586861f96590"
			}
		}
	})
	const res = await calc.execute([
		{
			type: "erc20-transfer-from-caller",
			token: loanToken,
			amount: 100000n,
		},
		{
			type: "morpho-read-total-borrow-assets",
			marketId: marketId,
		},
	])
	return res.result
}

const multiplier = 10000000