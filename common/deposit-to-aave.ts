import { verifyAllowance } from "./verify-allowance"
import { StrategyExecutor } from "./calculate-result"
import { deposit } from "./deposit"
import { Aave } from "./lending/aave"
import { toAddress } from "./types"

export async function depositToAave<T>(
	ex: StrategyExecutor<T>,
	amount: bigint,
	collateralToken: string,
	debtToken: string,
	leverage: number,
) {
	const vaultAddress = await ex.getVaultAddress()
	await verifyAllowance(ex.runner, debtToken, amount, vaultAddress)

	return deposit(ex, new Aave(toAddress(collateralToken), toAddress(debtToken)), amount, leverage)
}
