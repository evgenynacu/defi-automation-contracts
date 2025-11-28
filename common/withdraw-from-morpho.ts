import {StrategyExecutor} from "./calculate-result"
import {withdraw} from "./withdraw"
import {Morpho} from "./lending/morpho"

export async function withdrawFromMorpho<T>(ex: StrategyExecutor<T>, marketId: string, debtShare: number, collateralShare?: number): Promise<T> {
	return withdraw({
		ex,
		lending: new Morpho(marketId),
		debtShare: debtShare,
		collateralShare: collateralShare,
	})
}