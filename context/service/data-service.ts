import { address } from "../../common/types"
import { CalculateResult, createCalculateExecutor, StrategyExecutor } from "../../common/calculate-result"
import { ContractRunner } from "ethers"
import { withdrawFromMorpho } from "../../common/withdraw-from-morpho"
import { withdrawFromCompound } from "../../deploy/withdraw-from-compound"
import { withdrawFromAave } from "../../deploy/withdraw-from-aave"

export class DataService {
	constructor(private readonly runner: ContractRunner) {
	}

	async getData(request: DataRequest): Promise<Omit<DataResult, "calldata" | "ops">> {
		const executor = createCalculateExecutor(this.runner, request.vault, request.from)
		return getData(executor, request)
	}
}

async function getData(executor: StrategyExecutor<CalculateResult>, request: DataRequest): Promise<DataResult> {
	switch (request.type) {
		case "morpho-withdraw": {
			return toDataResult(
				`morpho-withdraw-${request.from}-${request.marketId}`,
				await withdrawFromMorpho(executor, request.marketId, 1)
			)
		}
		case "aave-withdraw": {
			return toDataResult(
				`aave-withdraw-${request.vault}-${request.collateralToken}-${request.debtToken}`,
				await withdrawFromAave(executor, request.collateralToken, request.debtToken, 1)
			)
		}
		case "compound-withdraw": {
			return toDataResult(
				`compound-withdraw-${request.from}-${request.comet}-${request.collateralToken}`,
				await withdrawFromCompound(executor, request.comet, request.collateralToken, 1),
			)
		}
		default:
			throw new Error("Unknown request type " + JSON.stringify(request))
	}
}

function toDataResult(id: string, { result, ops, calldata, ...data }: CalculateResult): DataResult {
	let numResult: number
	if (result > 10n ** 17n) {
		numResult = Number(result) / 10 ** 18
	} else {
		numResult = Number(result) / 10 ** 6
	}
	let rate: number | undefined
	if (data.in && data.out) {
		rate = data.out / data.in
	}
	return {
		id,
		result: numResult,
		rate,
		...data
	}
}

type DataResult = Omit<CalculateResult, "calldata" | "ops" | "result"> & {
	id: string
	result: number
	rate?: number
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

