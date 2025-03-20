import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { MORPHO_BLUE } from "./addresses"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { executeStrategy } from "./execute-strategy"
import { address } from "./types"

const multiplier = 1000000

/**
 * Withdraw part of the morpho position
 * @param hre
 * @param signer
 * @param marketId
 * @param share number from 0 to 1 (part of the position to withdraw)
 */
export async function withdrawFromMorpho(hre: HardhatRuntimeEnvironment, signer: HardhatEthersSigner, marketId: string, share: number) {
	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const morpho = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	const params = await morpho.idToMarketParams(marketId)
	const market = await morpho.market(marketId)
	const pos = await morpho.position(marketId, signer.address)

	const totalCollateral = pos.collateral
	const totalDebt = pos.borrowShares * market.totalBorrowAssets / market.totalBorrowShares

	console.log("total collateral: ", totalCollateral, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = totalCollateral * BigInt(share * multiplier - 100) / BigInt(multiplier)

	console.log("debt to withdraw: ", debtToWithdraw, "collateral to withdraw: ", collateralToWithdraw)

	await executeStrategy(deployment.address as address, [
		{
			type: "morpho-flash-loan",
			token: params.loanToken,
			amount: debtToWithdraw,
			innerOperations: [
				{
					type: "morpho-repay",
					marketId: marketId,
					amount: debtToWithdraw,
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
	])
}

//7303183318456727147208
//7303183318456727147208

//7303183318456728000000