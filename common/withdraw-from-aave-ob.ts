import {StrategyExecutor} from "./calculate-result"
import {withdraw} from "./withdraw"
import {toAddress} from "./types"
import {AaveOnBehalf} from "./lending/aave-on-behalf";

export async function withdrawFromAaveOnBehalf<T>(
	ex: StrategyExecutor<T>,
	collateralToken: string,
	debtToken: string,
	debtShare: number = 1,
	collateralShare?: number,
): Promise<T> {
	return withdraw({
		ex,
		lending: new AaveOnBehalf(toAddress(collateralToken), toAddress(debtToken)),
		debtShare: debtShare,
		collateralShare: collateralShare,
	})
}
