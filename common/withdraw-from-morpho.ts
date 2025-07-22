import { MORPHO_BLUE } from "./addresses"
import { createCalculateExecutor, StrategyExecutor } from "./calculate-result"
import { MorphoBlue__factory, MorphoOracle__factory } from "../typechain-types"
import { MaxUint256 } from "ethers"
import { getDecimals } from "./decimals"
import { getBalanceStorageSlot } from "./test-swap"
import { address, toAddress } from "./types"

const multiplier = 1000000

/**
 * Withdraw part of the morpho position
 * @param ex executor
 * @param marketId
 * @param share number from 0 to 1 (part of the position to withdraw)
 */
export async function withdrawFromMorpho<T>(ex: StrategyExecutor<T>, marketId: string, share: number): Promise<T> {
	const from = await ex.getFrom()

	const morpho = MorphoBlue__factory.connect(MORPHO_BLUE, ex.runner)
	const params = await morpho.idToMarketParams(marketId)
	const market = await morpho.market(marketId)
	const pos = await morpho.position(marketId, from)
	const totalBorrowAssets = await getTotalBorrowAssets(ex, marketId, toAddress(params.loanToken))
	// const totalBorrowAssets = market.totalBorrowAssets

	const totalCollateral = pos.collateral
	const totalDebt = pos.borrowShares * totalBorrowAssets / market.totalBorrowShares

	console.log("total collateral: ", totalCollateral, "total debt: ", totalDebt)

	const approxDebtToWithdraw = totalDebt * BigInt(share * multiplier + 1000) / BigInt(multiplier)
	const debtSharesToWithdraw = pos.borrowShares * BigInt(share * multiplier) / BigInt(multiplier)
	const collateralToWithdraw = totalCollateral * BigInt(share * multiplier) / BigInt(multiplier)

	console.log("debt shares to withdraw: ", debtSharesToWithdraw, "collateral to withdraw: ", collateralToWithdraw)

	const result = await ex.execute([
		{
			type: "morpho-flash-loan",
			token: params.loanToken,
			amount: approxDebtToWithdraw,
			innerOperations: [
				{
					type: "morpho-repay",
					marketId: marketId,
					assets: 0n,
					shares: debtSharesToWithdraw,
				},
				{
					type: "morpho-withdraw",
					marketId: marketId,
					amount: collateralToWithdraw,
				},
				{
					type: "swap",
					from: params.collateralToken,
					to: params.loanToken,
					amount: collateralToWithdraw,
				},
			]
		},
		{
			type: "erc20-transfer-to-caller",
			token: params.loanToken,
			amount: MaxUint256
		}
	])

	const oracle = MorphoOracle__factory.connect(params.oracle, ex.runner)
	const price = await oracle.price()
	const ltv = Number(totalDebt * 1000000n / (totalCollateral * price / 10n ** 36n)) / 1000000
	const lltv = Number(1000000n * params.lltv / 10n ** 18n) / 1000000
	return {
		...result,
		ltv: Number(totalDebt * 1000000n / (totalCollateral * price / 10n ** 36n)) / 1000000,
		hf: lltv / ltv,
		debt: Number(totalDebt) / (10 ** getDecimals(params.loanToken)),
		debtShares: Number(pos.borrowShares) / (10 ** 18),
		collateral: Number(totalCollateral) / (10 ** getDecimals(params.collateralToken)),
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