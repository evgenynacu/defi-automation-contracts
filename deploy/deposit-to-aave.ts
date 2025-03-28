import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { executeStrategy } from "./execute-strategy"
import { address } from "./types"
import { MorphoBlue } from "../typechain-types"
import { verifyAllowance } from "./verify-allowance"

export async function depositToAave(
	hre: HardhatRuntimeEnvironment,
	amount: bigint,
	collateralToken: string,
	debtToken: string,
	leverage: number,
) {
	const deployment = await hre.deployments.getOrNull("AaveVaultProxy")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const flashLoanAmount = amount * BigInt((leverage - 1) * 10000) / BigInt(10000)

	await verifyAllowance(debtToken, amount, deployment.address)

	await executeStrategy(deployment.address as address, [
		{
			type: "erc20-transfer-from-caller",
			token: debtToken,
			amount: amount,
		},
		{
			type: "morpho-flash-loan",
			token: debtToken,
			amount: flashLoanAmount,
			innerOperations: [
				{
					type: "swap",
					from: debtToken,
					to: collateralToken,
					amount: flashLoanAmount + amount,
				},
				{
					type: "aave-supply",
					amount: ethers.MaxUint256,
				},
				{
					type: "aave-borrow",
					token: debtToken,
					amount: flashLoanAmount,
				}
			]
		}
	])
}
