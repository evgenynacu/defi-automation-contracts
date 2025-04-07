import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { executeStrategy, getVaultAddress } from "./execute-strategy"
import { verifyAllowance } from "./verify-allowance"
import { ContractTransactionResponse } from "ethers"

export async function depositToAave(
	hre: HardhatRuntimeEnvironment,
	amount: bigint,
	collateralToken: string,
	debtToken: string,
	leverage: number,
	onlyEstimate: false
): Promise<ContractTransactionResponse>

export async function depositToAave(
	hre: HardhatRuntimeEnvironment,
	amount: bigint,
	collateralToken: string,
	debtToken: string,
	leverage: number,
	onlyEstimate: true
): Promise<bigint>

export async function depositToAave(
	hre: HardhatRuntimeEnvironment,
	amount: bigint,
	collateralToken: string,
	debtToken: string,
	leverage: number,
	onlyEstimate: boolean = false
) {
	const vaultAddress = await getVaultAddress(hre, "AaveVaultProxy")

	const flashLoanAmount = amount * BigInt((leverage - 1) * 10000) / BigInt(10000)

	await verifyAllowance(debtToken, amount, vaultAddress)

	return await executeStrategy(vaultAddress, [
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
	], onlyEstimate)
}
