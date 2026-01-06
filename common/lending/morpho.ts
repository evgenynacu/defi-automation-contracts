import {Deposit, Lending, Withdraw} from "../lending"
import {MorphoBlue, MorphoBlue__factory, MorphoOracle__factory} from "../../typechain-types"
import {createCalculateExecutor, StrategyExecutor} from "../calculate-result"
import {MORPHO_BLUE} from "../addresses"
import {address, toAddress} from "../types"
import {getTokenStateDiff} from "../test-swap"
import {getMorphoBlue} from "../get-morpho-blue";

export class Morpho implements Lending {
	private morpho: MorphoBlue | undefined

	constructor(
		readonly marketId: string,
		readonly onBehalfOf?: address,
	) {
	}

	async initDeposit(ex: StrategyExecutor<any>): Promise<Deposit> {
		const { chainId } = await ex.runner.provider!.getNetwork()
		this.morpho = MorphoBlue__factory.connect(getMorphoBlue(chainId), ex.runner)
		const onBehalfOf = this.onBehalfOf || await ex.getFrom()
		const [debt, collateral] = await this.morpho.idToMarketParams(this.marketId)
		return {
			debt: toAddress(debt),
			collateral: toAddress(collateral),
			getSupplyOperation: (amount: bigint) => ({
				type: "morpho-supply",
				marketId: this.marketId,
				amount,
				onBehalfOf,
			}),
			getBorrowOperation: (amount: bigint) => ({
				type: "morpho-borrow",
				marketId: this.marketId,
				amount,
				onBehalfOf,
			}),
		}
	}

	async initWithdraw(ex: StrategyExecutor<any>, debtShare: number, collateralShare: number): Promise<Withdraw> {
		const onBehalfOf = this.onBehalfOf || await ex.getFrom()
		const { chainId } = await ex.runner.provider!.getNetwork()
		const morpho = MorphoBlue__factory.connect(getMorphoBlue(chainId), ex.runner)
		const params = await morpho.idToMarketParams(this.marketId)
		const market = await morpho.market(this.marketId)
		const pos = await morpho.position(this.marketId, onBehalfOf)
		const totalBorrowAssets = await getTotalBorrowAssets(ex, this.marketId, toAddress(params.loanToken))

		const totalCollateral = pos.collateral
		const totalDebt = pos.borrowShares * totalBorrowAssets / market.totalBorrowShares

		const debtToRepay = totalDebt * BigInt(Math.floor(debtShare * multiplier + 1)) / BigInt(multiplier)
		const debtSharesToRepay = pos.borrowShares * BigInt(Math.floor(debtShare * multiplier)) / BigInt(multiplier)
		const collateralToWithdraw = totalCollateral * BigInt(Math.floor(collateralShare * multiplier)) / BigInt(multiplier)

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
				onBehalfOf,
			},
			getWithdrawOperation: (amount: bigint) => ({
				type: "morpho-withdraw",
				marketId: this.marketId,
				amount,
				onBehalfOf,
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
	const vault = await ex.getVaultAddress()
	const from = "0x5D3A5c30Dd9F7b8913EbE388bDC66E895CE7C75E"
	const calc = createCalculateExecutor(ex.runner, vault, from, {
		[loanToken]: {
			stateDiff: getTokenStateDiff(loanToken),
		},
	})
	const res = await calc.execute([
		{
			type: "erc20-transfer-from",
			token: loanToken,
			amount: 100000n,
			from,
		},
		{
			type: "morpho-read-total-borrow-assets",
			marketId: marketId,
		},
	])
	return res.result
}

const multiplier = 1000000