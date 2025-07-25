import { MaxUint256 } from "ethers"
import { MORPHO_BLUE } from "./addresses"
import { MorphoBlue, MorphoBlue__factory } from "../typechain-types"
import { verifyAllowance } from "../deploy/verify-allowance"
import { StrategyExecutor } from "./calculate-result"
import { address } from "./types"

export async function depositToMorpho<T>(
	ex: StrategyExecutor<T>,
	marketId: string,
	amount: bigint,
	leverage: number
): Promise<T> {
	const vaultAddress = await ex.getVaultAddress()

	const flashLoanAmount = amount * BigInt((leverage - 1) * 10000) / BigInt(10000)
	const morpho = MorphoBlue__factory.connect(MORPHO_BLUE, ex.runner)
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
					amount: MaxUint256,
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
