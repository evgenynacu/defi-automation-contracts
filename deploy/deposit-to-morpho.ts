import { ethers } from "hardhat"
import { MORPHO_BLUE } from "../common/addresses"
import { MorphoBlue } from "../typechain-types"
import { verifyAllowance } from "./verify-allowance"
import { StrategyExecutor } from "../common/calculate-result"
import { address } from "../common/types"

export async function depositToMorpho<T>(
	ex: StrategyExecutor<T>,
	marketId: string,
	amount: bigint,
	leverage: number
): Promise<T> {
	const vaultAddress = await ex.getVaultAddress()

	const flashLoanAmount = amount * BigInt((leverage - 1) * 10000) / BigInt(10000)
	const morpho = await ethers.getContractAt("MorphoBlue", MORPHO_BLUE)
	const [loanToken, collateralToken] = await morpho.idToMarketParams(marketId)

	await verifyVaultAuthorized(await ex.getFrom(), morpho, vaultAddress)
	await verifyAllowance(loanToken, amount, vaultAddress)
	console.log("total new debt:", flashLoanAmount, "own assets:", amount)

	return ex.execute([
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
	])
}

async function verifyVaultAuthorized(from: address, morpho: MorphoBlue, vault: string) {
	if (!(await morpho.isAuthorized(from, vault))) {
		if (process.env.DEBUG_FROM) {
			throw new Error("DEBUG_FROM is set, but vault " + vault + " is not authorized")
		}
		console.log("Enabling vault to manage caller's positions")
		const tx = await morpho.setAuthorization(vault, true)
		await tx.wait()
	}
}
