import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { COMET_WETH_ADDRESS, EZETH_ADDRESS, WETH_ADDRESS } from "./addresses"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { executeStrategy } from "./execute-strategy"
import { address } from "./types"

const multiplier = 10000000

/**
 * Withdraw part of the Compound positin
 * @param hre
 * @param signer
 * @param cometAddress
 * @param collateralToken
 * @param share number from 0 to 1 (part of the position to withdraw)
 */
export async function withdrawFromCompound(hre: HardhatRuntimeEnvironment, signer: HardhatEthersSigner, cometAddress: address, collateralToken: address, share: number) {
	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const comet = await ethers.getContractAt("IComet", cometAddress)
	const baseToken = await comet.baseToken()

	const collateralBalance = await comet.collateralBalanceOf(signer.address, collateralToken)
	const totalDebt = await comet.borrowBalanceOf(signer.address)

	console.log("total collateral: ", collateralBalance, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = collateralBalance * BigInt(share * multiplier) / BigInt(multiplier)

	await executeStrategy(deployment.address as address, [
		{
			type: "morpho-flash-loan",
			token: baseToken,
			amount: debtToWithdraw,
			innerOperations: [
				{
					type: "compound-v3-repay",
					comet: cometAddress,
					amount: debtToWithdraw,
				},
				{
					type: "compound-v3-withdraw",
					comet: cometAddress,
					token: collateralToken,
					amount: collateralToWithdraw,
				},
				{
					type: "swap",
					from: collateralToken,
					to: baseToken,
					amount: collateralToWithdraw,
				},
			]
		},
		{
			type: "erc20-transfer-to-caller",
			token: baseToken,
			amount: ethers.MaxUint256
		}
	])
}