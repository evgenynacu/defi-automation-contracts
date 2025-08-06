import { address } from "../../common/types"
import { CalculateResult, createCalculateExecutor, StrategyExecutor } from "../../common/calculate-result"
import { ContractRunner } from "ethers"
import { withdrawFromMorpho } from "../../common/withdraw-from-morpho"
import { withdrawFromCompound } from "../../common/withdraw-from-compound"
import { withdrawFromAave } from "../../common/withdraw-from-aave"
import { getAaveHealthFactor } from "../../common/get-aave-health-factor"
import { testSwap } from "../../common/test-swap"
import { tokens } from "../tokens"
import { getSupplyCaps } from "../aave"
import { getCompoundHealthFactor } from "../../common/get-compound-health-factor"

export class DataService {
	constructor(private readonly ethRunner: ContractRunner, private readonly arbRunner: ContractRunner) {
	}

	async getData(request: DataRequest): Promise<DataResult> {
		if (request.type === "aave-health-factor") {
			return getAaveHealthFactor(this.ethRunner, request.from)
		} else if (request.type === "swap-rate") {
			return getSwapRate(request)
		} else if (request.type === "aave-free-supply") {
			const caps = await getSupplyCaps(this.ethRunner, request.token, request.aToken)
			return {
				id: `aave-free-supply-${request.token}`,
				...caps,
				result: caps.available,
			}
		} else if (request.type === "compound-health-factor") {
			return this.getCompoundHF(request)
		} else {
			const executor = createCalculateExecutor(this.ethRunner, request.vault, request.from)
			return getData(executor, request)
		}
	}

	async getCompoundHF(request: CompoundHealthFactorRequest) {
		const { hf } = await getCompoundHealthFactor(this.arbRunner.provider!, request.comet, request.from, request.collateral)
		return {
			id: `compound-hf-${request.from}-${request.comet}`,
			result: hf
		}
	}
}

async function getSwapRate(request: SwapRateRequest) {
	const result = await testSwap(request.fromToken, request.amount, request.toToken)
	const mul = 10000000000
	const rate = Number(result * BigInt(mul) / request.amount) / mul
	return {
		id: `swap-rate-${tokens[request.fromToken]}-${tokens[request.toToken]}`,
		result: rate
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

type DataResult = {
	id: string
	[key: string]: any;
}

export type DataRequest =
	AaveHealthFactorRequest
	| AaveFreeSupplyRequest
	| SwapRateRequest
	| CompoundHealthFactorRequest
	|
	(CommonPart &
		(MorphoWithdrawDataRequest | AaveWithdrawDataRequest | CompoundWithdrawDataRequest))

export type AaveHealthFactorRequest = {
	type: "aave-health-factor"
	from: address
}

export type CompoundHealthFactorRequest = {
	type: "compound-health-factor"
	from: address
	comet: address
	collateral: address
}

export type AaveFreeSupplyRequest = {
	type: "aave-free-supply"
	token: address
	aToken: address
}

export type SwapRateRequest = {
	type: "swap-rate"
	fromToken: address,
	toToken: address,
	amount: bigint,
}

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

