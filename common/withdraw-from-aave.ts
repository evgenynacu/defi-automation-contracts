import { StrategyExecutor } from "./calculate-result"
import { withdraw } from "./withdraw"
import { Aave } from "./lending/aave"
import { toAddress } from "./types"

export async function withdrawFromAave<T>(
	ex: StrategyExecutor<T>,
	collateralToken: string,
	debtToken: string,
	share: number
): Promise<T> {
	return withdraw(ex, new Aave(toAddress(collateralToken), toAddress(debtToken)), share)
}
