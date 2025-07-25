import { MaxUint256 } from "ethers"
import { verifyAllowance } from "../deploy/verify-allowance"
import { StrategyExecutor } from "./calculate-result"

export async function depositToAave<T>(
	ex: StrategyExecutor<T>,
	amount: bigint,
	collateralToken: string,
	debtToken: string,
	leverage: number,
) {
	const vaultAddress = await ex.getVaultAddress()

	const flashLoanAmount = amount * BigInt((leverage - 1) * 10000) / BigInt(10000)

	await verifyAllowance(debtToken, amount, vaultAddress)

	return ex.execute([
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
					amount: MaxUint256,
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
