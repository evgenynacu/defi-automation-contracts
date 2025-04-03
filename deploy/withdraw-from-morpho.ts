import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { MORPHO_BLUE } from "./addresses"
import { executeStrategy, getSignerAddress, getVaultAddress } from "./execute-strategy"
import { ContractTransactionResponse } from "ethers"

const multiplier = 1000000

export async function withdrawFromMorpho(hre: HardhatRuntimeEnvironment, marketId: string, share: number, estimateOnly: true): Promise<bigint>
export async function withdrawFromMorpho(hre: HardhatRuntimeEnvironment, marketId: string, share: number, estimateOnly: false): Promise<ContractTransactionResponse>

/**
 * Withdraw part of the morpho position
 * @param hre
 * @param marketId
 * @param share number from 0 to 1 (part of the position to withdraw)
 * @param estimateOnly
 */
export async function withdrawFromMorpho(hre: HardhatRuntimeEnvironment, marketId: string, share: number, estimateOnly: boolean) {
	const from = await getSignerAddress()
	const vaultAddress = await getVaultAddress(hre)

	const morpho = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	const params = await morpho.idToMarketParams(marketId)
	const market = await morpho.market(marketId)
	const pos = await morpho.position(marketId, from)

	const totalCollateral = pos.collateral
	const totalDebt = pos.borrowShares * market.totalBorrowAssets / market.totalBorrowShares

	console.log("total collateral: ", totalCollateral, "total debt: ", totalDebt)

	const approxDebtToWithdraw = totalDebt * BigInt(share * multiplier + 1000) / BigInt(multiplier)
	const debtSharesToWithdraw = pos.borrowShares * BigInt(share * multiplier) / BigInt(multiplier)
	const collateralToWithdraw = totalCollateral * BigInt(share * multiplier) / BigInt(multiplier)

	console.log("debt shares to withdraw: ", debtSharesToWithdraw, "collateral to withdraw: ", collateralToWithdraw)

	return await executeStrategy(vaultAddress, [
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
			amount: ethers.MaxUint256
		}
	], estimateOnly)
}

//7303183318456727147208
//7303183318456727147208

//7303183318456728000000