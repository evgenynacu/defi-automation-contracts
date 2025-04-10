import { address } from "../../common/types"
import { CalculateResult, createCalculateExecutor, StrategyExecutor } from "../../common/calculate-result"
import { ContractRunner } from "ethers"
import { withdrawFromMorpho } from "../../common/withdraw-from-morpho"
import { withdrawFromCompound } from "../../deploy/withdraw-from-compound"
import { withdrawFromAave } from "../../deploy/withdraw-from-aave"

export class DataService {
	constructor(private readonly runner: ContractRunner) {
	}

	async getData(request: DataRequest): Promise<Omit<DataResult, "calldata" | "ops" | "result">> {
		const executor = createCalculateExecutor(this.runner, request.vault, request.from)

		const { calldata, ops, result, ...response } = await getData(executor, request)
		return response
	}
}

async function getData(executor: StrategyExecutor<CalculateResult>, request: DataRequest): Promise<DataResult> {
	switch (request.type) {
		case "morpho-withdraw": {
			const result = await withdrawFromMorpho(executor, request.marketId, 1)
			return {
				id: `morpho-withdraw-${request.from}-${request.marketId}`,
				...result
			}
		}
		case "aave-withdraw": {
			const result = await withdrawFromAave(executor, request.collateralToken, request.debtToken, 1)
			return {
				id: `aave-withdraw-${request.vault}-${request.collateralToken}-${request.debtToken}`,
				...result,
			}
		}
		case "compound-withdraw": {
			const result = await withdrawFromCompound(executor, request.comet, request.collateralToken, 1)
			return {
				id: `compound-withdraw-${request.from}-${request.comet}-${request.collateralToken}`,
				...result,
			}
		}
		default:
			throw new Error("Unknown request type " + JSON.stringify(request))
	}
}

type DataResult = CalculateResult & {
	id: string
}

export type DataRequest = CommonPart &
	(MorphoWithdrawDataRequest | AaveWithdrawDataRequest | CompoundWithdrawDataRequest)

type CommonPart = {
	vault: address
	from: address
}

export type MorphoWithdrawDataRequest = {
	type: "morpho-withdraw"
	marketId: `0x${string}`
}

export type AaveWithdrawDataRequest = {
	type: "aave-withdraw"
	vault: address
	from: address
	collateralToken: address
	debtToken: address
}

export type CompoundWithdrawDataRequest = {
	type: "compound-withdraw"
	vault: address
	from: address
	comet: address
	collateralToken: address
}

