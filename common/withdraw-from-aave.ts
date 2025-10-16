import {StrategyExecutor} from "./calculate-result"
import {withdraw} from "./withdraw"
import {Aave} from "./lending/aave"
import {toAddress} from "./types"

export async function withdrawFromAave<T>(
	ex: StrategyExecutor<T>,
	collateralToken: string,
	debtToken: string,
	debtShare: number = 1,
	collateralShare?: number,
): Promise<T> {
	return withdraw({
		ex,
		lending: new Aave(toAddress(collateralToken), toAddress(debtToken)),
		debtShare: debtShare,
		collateralShare: collateralShare,
	})
}
