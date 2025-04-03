import { ethers } from "hardhat"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { MORPHO_BLUE } from "./addresses"
import { executeStrategy, getSignerAddress } from "./execute-strategy"
import { address } from "./types"
import { MorphoBlue } from "../typechain-types"
import { verifyAllowance } from "./verify-allowance"
import { ContractTransactionResponse } from "ethers"

export async function depositToMorpho(
	hre: HardhatRuntimeEnvironment,
	marketId: string,
	amount: bigint,
	leverage: number,
	estimateOnly: true
): Promise<bigint>

export async function depositToMorpho(
	hre: HardhatRuntimeEnvironment,
	marketId: string,
	amount: bigint,
	leverage: number,
	estimateOnly: false
): Promise<ContractTransactionResponse>

export async function depositToMorpho(
	hre: HardhatRuntimeEnvironment,
	marketId: string,
	amount: bigint,
	leverage: number,
	estimateOnly: boolean = false
): Promise<ContractTransactionResponse | bigint> {
	const deployment = await hre.deployments.getOrNull("AutomatedVault")
	if (deployment === undefined || deployment === null) {
		throw new Error("Vault not deployed")
	}

	const flashLoanAmount = amount * BigInt((leverage - 1) * 10000) / BigInt(10000)
	const morpho = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	const [loanToken, collateralToken] = await morpho.idToMarketParams(marketId)

	await verifyVaultAuthorized(morpho, deployment.address)
	await verifyAllowance(loanToken, amount, deployment.address)

	return await executeStrategy(deployment.address as address, [
		{
			type: "erc20-transfer-from-caller",
			token: loanToken,
			amount: amount,
		},
		{
			type: "morpho-flash-loan",
			token: loanToken,
			amount: flashLoanAmount,
			innerOperations: [
				{
					type: "swap",
					from: loanToken,
					to: collateralToken,
					amount: flashLoanAmount + amount,
				},
				{
					type: "morpho-supply",
					marketId,
					amount: ethers.MaxUint256,
				},
				{
					type: "morpho-borrow",
					marketId,
					amount: flashLoanAmount,
				}
			]
		}
	], estimateOnly)
}

async function verifyVaultAuthorized(morpho: MorphoBlue, vault: string) {
	const signer = await getSignerAddress()
	if (await morpho.isAuthorized(signer, vault)) {
		console.log("Vault already has rights to manage caller's positions")
	} else {
		if (process.env.DEBUG_FROM) {
			throw new Error("DEBUG_FROM is set, but vault is not authorized")
		}
		console.log("Enabling vault to manage caller's positions")
		const tx = await morpho.setAuthorization(vault, true)
		await tx.wait()
	}
}
