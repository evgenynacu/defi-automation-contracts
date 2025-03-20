import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { COMET_WETH_ADDRESS, EZETH_ADDRESS, WETH_ADDRESS } from "./addresses"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { executeStrategy } from "./execute-strategy"
import { address } from "./types"

const multiplier = 10000000

/**
 * Withdraw part of the ezETH position from Compound
 * @param hre
 * @param signer
 * @param share number from 0 to 1 (part of the position to withdraw)
 */
export async function withdrawEzETH(hre: HardhatRuntimeEnvironment, signer: HardhatEthersSigner, share: number) {
	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const comet = await ethers.getContractAt("IComet", COMET_WETH_ADDRESS)

	const ezEthBalance = await comet.collateralBalanceOf(signer.address, EZETH_ADDRESS)
	const totalDebt = await comet.borrowBalanceOf(signer.address)

	console.log("total collateral: ", ezEthBalance, "total debt: ", totalDebt)

	const debtToWithdraw = totalDebt * BigInt(share * multiplier + 1) / BigInt(multiplier)
	const collateralToWithdraw = ezEthBalance * BigInt(share * multiplier) / BigInt(multiplier)

	await executeStrategy(deployment.address as address, [
		{
			type: "morpho-flash-loan",
			token: WETH_ADDRESS,
			amount: debtToWithdraw,
			innerOperations: [
				{
					type: "compound-v3-repay",
					comet: COMET_WETH_ADDRESS,
					amount: debtToWithdraw,
				},
				{
					type: "compound-v3-withdraw",
					comet: COMET_WETH_ADDRESS,
					token: EZETH_ADDRESS,
					amount: collateralToWithdraw,
				},
				{
					type: "swap",
					from: EZETH_ADDRESS,
					to: WETH_ADDRESS,
					amount: collateralToWithdraw,
				},
			]
		},
		{
			type: "erc20-transfer-to-caller",
			token: WETH_ADDRESS,
			amount: ethers.MaxUint256
		}
	])
}