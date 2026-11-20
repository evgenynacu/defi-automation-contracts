import {address} from "../../common/types"
import {FlashLoanProvider} from "../../common/flash-loan-provider"
import {CalculateResult, createCalculateExecutor, StrategyExecutor} from "../../common/calculate-result"
import {ContractRunner} from "ethers"
import {withdrawFromMorpho} from "../../common/withdraw-from-morpho"
import {withdrawFromCompound} from "../../common/withdraw-from-compound"
import {withdrawFromAave} from "../../common/withdraw-from-aave"
import {getAaveHealthFactor} from "../../common/get-aave-health-factor"
import {testSwap} from "../../common/test-swap"
import {tokens} from "../tokens"
import {getSupplyCaps} from "../aave"
import {getCompoundHealthFactor} from "../../common/get-compound-health-factor"
import {withdraw} from "../../common/withdraw";
import {Euler} from "../../common/lending/euler";
import {PendleMarket__factory} from "../../typechain-types";
import {withdrawFromAaveOnBehalf} from "../../common/withdraw-from-aave-ob";
import {getAaveV4Capacity} from "../aave-v4/get-capacity-data";
import {getMorphoBorrowRate} from "../../common/get-morpho-borrow-rate";
import {getCompoundBorrowRate} from "../../common/get-compound-borrow-rate";
import {getMorphoHealthFactor} from "../../common/get-morpho-health-factor";
import {getPoolLiquidity, PoolSource} from "../../common/get-pool-liquidity";

export class DataService {
	constructor(private readonly ethRunner: ContractRunner, private readonly arbRunner: ContractRunner, private readonly plasmaRunner: ContractRunner) {
	}

	async getData(request: DataRequest): Promise<DataResult> {
		if (request.type === "aave-health-factor") {
			return getAaveHealthFactor(this.ethRunner, request.from)
		} else if (request.type === "swap-rate") {
			return getSwapRate(request)
		} else if (request.type === "aave-v4-capacity") {
			return getAaveV4Capacity(this.ethRunner, request)
		} else if (request.type === "morpho-borrow-rate") {
			return getMorphoBorrowRate(this.ethRunner, request.marketId)
		} else if (request.type === "morpho-health-factor") {
			return getMorphoHealthFactor(this.ethRunner, request.marketId, request.owner)
		} else if (request.type === "compound-borrow-rate") {
			return getCompoundBorrowRate(this.getRunner(request.chainId), request.comet)
		} else if (request.type === "pool-liquidity") {
			return {
				id: poolLiquidityJobId(request.venue, request.source),
				result: await getPoolLiquidity(this.ethRunner, request.source),
			}
		} else if (request.type === "aave-free-supply") {
			const caps = await getSupplyCaps(this.ethRunner, request.token, request.aToken)
			return {
				id: `aave-free-supply-${request.token}`,
				...caps,
				result: caps.available,
			}
		} else if (request.type === "compound-health-factor") {
			return this.getCompoundHF(request)
		} else if (request.type === "pendle-implied-rate") {
			return {
				id: `pendle-implied-rate-${request.market}`,
				result: await getPendleImpliedRate(this.ethRunner, request),
			}
		} else {
			const runner = this.getRunnerByVault(request.vault)
			const executor = createCalculateExecutor(runner, request.vault, request.from)
			return getData(executor, request)
		}
	}

	/**
	 * Picks the provider for a chain.
	 *
	 * The vault-keyed lookup below cannot serve requests that have no vault, and leaving the chain
	 * implicit would silently make a request type single-network.
	 */
	getRunner(chainId: number): ContractRunner {
		switch (chainId) {
			case 1:
				return this.ethRunner
			case 42161:
				return this.arbRunner
			case 9745:
				return this.plasmaRunner
			default:
				throw new Error(`No provider configured for chain ${chainId}`)
		}
	}

	getRunnerByVault(vault: address) {
		switch (vault) {
			case "0x85ca192a8AE32CaEB3bd14dbF0186B59023E2024":
				return this.arbRunner
			case "0xAbF51D0049cdd58F54Ffc38D4Ea370340e79855D":
				return this.plasmaRunner
			default:
				return this.ethRunner
		}
	}


	async getCompoundHF(request: CompoundHealthFactorRequest) {
		const {hf} = await getCompoundHealthFactor(this.arbRunner.provider!, request.comet, request.from, request.collateral)
		return {
			id: `compound-hf-${request.from}-${request.comet}`,
			result: hf
		}
	}
}

/**
 * Row id for one venue's depth.
 *
 * Exported because the backfill writes into the same `data` rows as the live sync — if the two ever
 * disagreed on this string, the reconstructed history would land under a different job and the chart
 * would show a gap instead of a continuation. A venue can appear once per token it holds, so the token
 * is part of the id.
 */
export function poolLiquidityJobId(venue: string, source: PoolSource): string {
	return `pool-liquidity-${venue}-${source.kind === "uniswap-v4" ? source.poolId : source.token}`
}

async function getPendleImpliedRate(runner: ContractRunner, request: PendleImpliedRateRequest) {
	const market = PendleMarket__factory.connect(request.market, runner)
	const {lastLnImpliedRate} = await market._storage()
	return Math.round(10000 * (Math.exp(Number(lastLnImpliedRate) / 1e18) - 1))
}

async function getSwapRate(request: SwapRateRequest) {
	const result = await testSwap(request.fromToken, request.amount, request.toToken)
	const mul = 10000000000
	const rate = Number(result * BigInt(mul) * (request.multiplier || 1n) / (request.amount * (request.divider || 1n))) / mul
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
				await withdrawFromMorpho(executor, request.marketId, request.debtShare || 1, request.collateralShare)
			)
		}
		case "aave-withdraw": {
			return toDataResult(
				`aave-withdraw-${request.vault}-${request.collateralToken}-${request.debtToken}`,
				await withdrawFromAave(executor, request.collateralToken, request.debtToken, request.debtShare, request.collateralShare)
			)
		}
		case "aave-ob-withdraw": {
			return toDataResult(
				`aaveob-withdraw-${request.vault}-${request.collateralToken}-${request.debtToken}`,
				await withdrawFromAaveOnBehalf(executor, request.collateralToken, request.debtToken, request.debtShare, request.collateralShare, request.flashLoanProvider)
			)
		}
		case "compound-withdraw": {
			return toDataResult(
				`compound-withdraw-${request.from}-${request.comet}-${request.collateralToken}`,
				await withdrawFromCompound(executor, request.comet, request.collateralToken, 1),
			)
		}
		case "euler-withdraw": {
			const euler = new Euler(request.collateralVault, request.debtVault, request.accountId);
			return toDataResult(
				`euler-withdraw-${request.from}-${request.collateralVault}-${request.debtVault}`,
				await withdraw({ex: executor, lending: euler, debtShare: 1}),
			)
		}
		default:
			throw new Error("Unknown request type " + JSON.stringify(request))
	}
}

function toDataResult(id: string, {result, ops, calldata, ...data}: CalculateResult): DataResult {
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
	| AaveV4CapacityRequest
	| MorphoBorrowRateRequest
	| CompoundBorrowRateRequest
	| MorphoHealthFactorRequest
	| PoolLiquidityRequest
	| PendleImpliedRateRequest
	| SwapRateRequest
	| CompoundHealthFactorRequest
	|
	(CommonPart &
		(MorphoWithdrawDataRequest | AaveWithdrawDataRequest | AaveOnBehalfWithdrawDataRequest | CompoundWithdrawDataRequest | EulerWithdrawDataRequest))

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

/**
 * Remaining room on one Aave v4 spoke reserve.
 *
 * The hub is part of the key, not a convenience: a spoke can list the same token twice when it draws it
 * from two different hubs, and those are separate reserves with separate caps.
 */
export type AaveV4CapacityRequest = {
	type: "aave-v4-capacity"
	spoke: address
	token: address
	hub: address
}

/** Current cost of the debt leg of a levered position. */
export type MorphoBorrowRateRequest = {
	type: "morpho-borrow-rate"
	marketId: `0x${string}`
}

/**
 * Liquidation distance for one account's position on a Morpho Blue market.
 *
 * Separate from morpho-withdraw, which also yields a health factor: that one simulates the whole exit
 * and stops reporting when no swap route quotes, while this reads chain state and keeps working.
 */
export type MorphoHealthFactorRequest = {
	type: "morpho-health-factor"
	marketId: `0x${string}`
	owner: address
}

/**
 * Same question for a Compound III market.
 *
 * Comet markets are deployed per chain, so the chain is part of the request rather than assumed —
 * the same base asset has its own market and its own rate on each one.
 */
export type CompoundBorrowRateRequest = {
	type: "compound-borrow-rate"
	chainId: number
	comet: address
	/**
	 * Gauge label, and required rather than defaulting to the comet address: a series named after an
	 * address would be renamed the moment someone added a readable label, losing its history.
	 *
	 * Must identify the market across chains, since the label set does not carry the chain — the same
	 * base asset has a separate Comet on each one. Hence "USDT0-arb", not "USDT0".
	 */
	market: string
}

/**
 * Depth of one venue on a swap route.
 *
 * Carries the source rather than a key into a table so the request stays self-describing, the same way
 * AaveV4CapacityRequest carries its own (spoke, hub, token).
 */
export type PoolLiquidityRequest = {
	type: "pool-liquidity"
	stage: string
	venue: string
	source: PoolSource
}

export type AaveFreeSupplyRequest = {
	type: "aave-free-supply"
	token: address
	aToken: address
}

export type PendleImpliedRateRequest = {
	type: "pendle-implied-rate"
	market: address
}

export type SwapRateRequest = {
	type: "swap-rate"
	fromToken: address,
	toToken: address,
	amount: bigint,
	multiplier?: bigint,
	divider?: bigint,
}

type CommonPart = {
	vault: address
	from: address
	flashLoanProvider?: FlashLoanProvider
}

export type MorphoWithdrawDataRequest = {
	type: "morpho-withdraw"
	marketId: `0x${string}`
	debtShare?: number
	collateralShare?: number
}

export type EulerWithdrawDataRequest = {
	type: "euler-withdraw"
	accountId: number
	collateralVault: `0x${string}`
	debtVault: `0x${string}`
}

export type AaveOnBehalfWithdrawDataRequest = {
	type: "aave-ob-withdraw"
	vault: address
	from: address
	collateralToken: address
	debtToken: address
	debtShare?: number
	collateralShare?: number
}


export type AaveWithdrawDataRequest = {
	type: "aave-withdraw"
	vault: address
	from: address
	collateralToken: address
	debtToken: address
	debtShare?: number
	collateralShare?: number
}

export type CompoundWithdrawDataRequest = {
	type: "compound-withdraw"
	vault: address
	from: address
	comet: address
	collateralToken: address
}

