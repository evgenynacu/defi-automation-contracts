import {StrategyExecutor} from "./calculate-result"
import {withdraw} from "./withdraw"
import {Morpho} from "./lending/morpho"

export async function withdrawFromMorpho<T>(ex: StrategyExecutor<T>, marketId: string, share: number): Promise<T> {
	return withdraw({
		ex,
		lending: new Morpho(marketId),
		debtShare: share,
	})
}