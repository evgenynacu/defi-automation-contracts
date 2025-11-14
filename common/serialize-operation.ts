import { HasOperation } from "../typechain-types/contracts/vault/AutomatedVault"
import { type ContractRunner } from "ethers"
import { address } from "./types"
import { getSwaps } from "./swap/swap"
import {
	AaveFlashLoanStrategy__factory,
	CompoundV3Strategy__factory,
	Erc20TransferStrategy__factory, EthenaS4Strategy__factory, EulerV2Strategy__factory,
	GenericAaveStrategy__factory, MerklStrategy__factory,
	MorphoFlashLoanStrategy__factory,
	MorphoReadStrategy__factory,
	MorphoStrategy__factory,
	SwapStrategy__factory
} from "../typechain-types"
import { getDecimals } from "./decimals"

export const ERC20_STRATEGY_INDEX = 0
export const MORPHO_FLASH_LOAN_STRATEGY_INDEX = 2
export const AAVE_FLASH_LOAN_STRATEGY_INDEX = 3
export const COMPOUND_V3_STRATEGY_INDEX = 4
export const MORPHO_STRATEGY_INDEX = 5
export const AAVE_STRATEGY_INDEX = 6
export const MORPHO_READ_STRATEGY_INDEX = 7
export const PENDLE_STRATEGY_INDEX = 8
export const ODOS_STRATEGY_INDEX = 9
export const KYBER_STRATEGY_INDEX = 10
export const EULER_STRATEGY_INDEX = 11
export const MERKL_STRATEGY_INDEX = 12
export const STRATA_STRATEGY_INDEX = 13
export const ETHENA_S4_STRATEGY_INDEX = 14

export type MerklStrategyOperation = {
	type: 'merkl'
	data: `0x${string}`
}

export type EthenaS4StrategyOperation = {
	type: 'ethenaS4'
	data: `0x${string}`
}

export type TransferErc20FromCallerOperation = {
	type: 'erc20-transfer-from'
	token: string
	from: string
	amount: bigint
}

export type TransferErc20ToCallerOperation = {
	type: 'erc20-transfer-to'
	token: string
	to: string
	amount: bigint
}

export type SwapOperation = {
	type: 'swap'
	from: string
	to: string
	amount: bigint
	preferred?: string | string[]
	txOrigin: address
}

type CompoundV3SupplyOperation = {
	type: 'compound-v3-supply'
	comet: string
	token: string
	amount: bigint
	onBehalfOf: string
}

type CompoundV3WithdrawOperation = {
	type: 'compound-v3-withdraw'
	comet: string
	token: string
	amount: bigint
	onBehalfOf: string
}

type CompoundV3BorrowOperation = {
	type: 'compound-v3-borrow'
	comet: string
	amount: bigint
	onBehalfOf: string
}

type CompoundV3RepayOperation = {
	type: 'compound-v3-repay'
	comet: string
	amount: bigint
	onBehalfOf: string
}

type CompoundV3Operation =
	| CompoundV3SupplyOperation
	| CompoundV3WithdrawOperation
	| CompoundV3BorrowOperation
	| CompoundV3RepayOperation

export type MorphoSupplyOperation = {
	type: 'morpho-supply'
	marketId: string
	amount: bigint
	onBehalfOf: string
}

export type MorphoWithdrawOperation = {
	type: 'morpho-withdraw'
	marketId: string
	amount: bigint
	onBehalfOf: string
}

export type MorphoBorrowOperation = {
	type: 'morpho-borrow'
	marketId: string
	amount: bigint
	onBehalfOf: string
}

export type MorphoRepayOperation = {
	type: 'morpho-repay'
	marketId: string
	assets: bigint
	shares: bigint
	onBehalfOf: string
}

type MorphoOperation =
	| MorphoSupplyOperation
	| MorphoWithdrawOperation
	| MorphoBorrowOperation
	| MorphoRepayOperation

type EulerSupplyOperation = {
	type: 'euler-supply'
	onBehalfOf: string
	vault: string
	amount: bigint
}

type EulerWithdrawOperation = {
	type: 'euler-withdraw'
	onBehalfOf: string
	vault: string
	amount: bigint
}

type EulerBorrowOperation = {
	type: 'euler-borrow'
	onBehalfOf: string
	vault: string
	amount: bigint
}

type EulerRepayOperation = {
	type: 'euler-repay'
	onBehalfOf: string
	vault: string
	amount: bigint
}

type EulerOperation =
	| EulerSupplyOperation
	| EulerWithdrawOperation
	| EulerBorrowOperation
	| EulerRepayOperation

export type AaveSupplyOperation = {
	type: 'aave-supply'
	token: string
	amount: bigint
}

export type AaveInitOperation = {
	type: 'aave-init'
	category: number
}

export type AaveWithdrawOperation = {
	type: 'aave-withdraw'
	token: string
	amount: bigint
}

export type AaveBorrowOperation = {
	type: 'aave-borrow'
	token: string
	amount: bigint
}

export type AaveRepayOperation = {
	type: 'aave-repay'
	token: string
	amount: bigint
}

type AaveOperation =
	| AaveSupplyOperation
	| AaveWithdrawOperation
	| AaveBorrowOperation
	| AaveRepayOperation
  | AaveInitOperation


export type MorphoFlashLoanOperation = {
	type: 'morpho-flash-loan'
	token: string
	amount: bigint
	innerOperations: InnerStrategyOperation[]
}

export type MorphoReadTotalBorrowAssetsOperation = {
	type: 'morpho-read-total-borrow-assets'
	marketId: string
}

export type AaveFlashLoanOperation = {
	type: 'aave-flash-loan'
	token: string
	amount: bigint
	innerOperations: InnerStrategyOperation[]
}

export type InnerStrategyOperation =
	| TransferErc20FromCallerOperation
	| TransferErc20ToCallerOperation
	| SwapOperation
	| CompoundV3Operation
	| MorphoOperation
	| EulerOperation
	| AaveOperation
	| MorphoReadTotalBorrowAssetsOperation

export type StrategyOperation =
	| MerklStrategyOperation
	| EthenaS4StrategyOperation
	| InnerStrategyOperation
	| MorphoFlashLoanOperation
	| AaveFlashLoanOperation

export async function serializeOperations(runner: ContractRunner, vault: address, ops: StrategyOperation[]): Promise<OperationWithInfo[][]> {
	const serializedOps = await Promise.all(ops.map(op => serializeOperation(runner, vault, op)))
	return crossJoin(serializedOps)
}

export type OperationWithInfo = HasOperation.OperationStruct & {
	info?: string,
	in?: number,
	out?: number,
}

/**
 * Serialized op
 * @param runner ethers runner
 * @param vault vault which will execute any swap operation (needed to generate correct calldata for swapping)
 * @param op operation to serialize
 * @return Array of possible operations
 */
async function serializeOperation(runner: ContractRunner, vault: address, op: StrategyOperation): Promise<OperationWithInfo[]> {
	switch (op["type"]) {
		case "merkl": {
			const impl = MerklStrategy__factory.createInterface()
			return [{
				position: MERKL_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("getRewards", [op.data])
			}]
		}
		case "ethenaS4": {
			const impl = EthenaS4Strategy__factory.createInterface()
			return [{
				position: ETHENA_S4_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("getRewards", [op.data])
			}]
		}
		case "morpho-read-total-borrow-assets": {
			const impl = MorphoReadStrategy__factory.createInterface()
			return [{
				position: MORPHO_READ_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("getMarketTotalBorrowAssets", [op.marketId])
			}]
		}
		case 'aave-init': {
			const impl = GenericAaveStrategy__factory.createInterface()
			return [{
				position: AAVE_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("init", [op.category]),
			}]
		}
		case "aave-supply": {
			const impl = GenericAaveStrategy__factory.createInterface()
			return [{
				position: AAVE_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("supplyCollateral", [op.token, op.amount]),
			}]
		}
		case "aave-withdraw": {
			const impl = GenericAaveStrategy__factory.createInterface()
			return [{
				position: AAVE_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("withdrawCollateral", [op.token, op.amount]),
			}]
		}
		case "aave-borrow": {
			const impl = GenericAaveStrategy__factory.createInterface()
			return [{
				position: AAVE_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("borrowDebt", [op.token, op.amount]),
			}]
		}
		case "aave-repay": {
			const impl = GenericAaveStrategy__factory.createInterface()
			return [{
				position: AAVE_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("repayDebt", [op.token, op.amount]),
			}]
		}
		case "morpho-supply": {
			const impl = MorphoStrategy__factory.createInterface()
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("supplyCollateral", [op.marketId, op.onBehalfOf, op.amount]),
			}]
		}
		case "morpho-withdraw": {
			const impl = MorphoStrategy__factory.createInterface()
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("withdrawCollateral", [op.marketId, op.onBehalfOf, op.amount]),
			}]
		}
		case "morpho-borrow": {
			const impl = MorphoStrategy__factory.createInterface()
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("borrowFromMarket", [op.marketId, op.onBehalfOf, op.amount]),
			}]
		}
		case "morpho-repay": {
			const impl = MorphoStrategy__factory.createInterface()
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("repayDebt", [op.marketId, op.onBehalfOf, op.assets, op.shares]),
			}]
		}
		case "euler-supply": {
			const impl = EulerV2Strategy__factory.createInterface()
			return [{
				position: EULER_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("supplyCollateral", [op.onBehalfOf, op.vault, op.amount]),
			}]
		}
		case "euler-withdraw": {
			const impl = EulerV2Strategy__factory.createInterface()
			return [{
				position: EULER_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("withdrawCollateral", [op.onBehalfOf, op.vault, op.amount]),
			}]
		}
		case "euler-borrow": {
			const impl = EulerV2Strategy__factory.createInterface()
			return [{
				position: EULER_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("borrowDebt", [op.onBehalfOf, op.vault, op.amount]),
			}]
		}
		case "euler-repay": {
			const impl = EulerV2Strategy__factory.createInterface()
			return [{
				position: EULER_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("repayDebt", [op.onBehalfOf, op.vault, op.amount]),
			}]
		}
		case "compound-v3-supply": {
			const impl = CompoundV3Strategy__factory.createInterface()
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("supplyCollateral", [op.comet, op.onBehalfOf, op.token, op.amount]),
			}]
		}
		case "compound-v3-withdraw": {
			const impl = CompoundV3Strategy__factory.createInterface()
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("withdrawCollateral", [op.comet, op.onBehalfOf, op.token, op.amount]),
			}]
		}
		case "compound-v3-borrow": {
			const impl = CompoundV3Strategy__factory.createInterface()
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("borrowBaseToken", [op.comet, op.onBehalfOf, op.amount]),
			}]
		}
		case "compound-v3-repay": {
			const impl = CompoundV3Strategy__factory.createInterface()
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("repayBaseToken", [op.comet, op.onBehalfOf, op.amount]),
			}]
		}
		case "morpho-flash-loan": {
			const impl = MorphoFlashLoanStrategy__factory.createInterface()
			const innerOperations = await Promise.all(op.innerOperations.map(it => serializeOperation(runner, vault, it)))
			const crossJoined = crossJoin(innerOperations)
			return crossJoined.map(ops => ({
				position: MORPHO_FLASH_LOAN_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("executeFlashLoan", [op.token, op.amount, ops]),
				info: ops.map(it => it.info).join(""),
				in: ops.map(it => it.in).find(it => it !== undefined),
				out: ops.map(it => it.out).find(it => it !== undefined),
			}))
		}
		case "aave-flash-loan": {
			const impl = AaveFlashLoanStrategy__factory.createInterface()
			const innerOperations = await Promise.all(op.innerOperations.map(it => serializeOperation(runner, vault, it)))
			const crossJoined = crossJoin(innerOperations)
			return crossJoined.map(ops => ({
				position: AAVE_FLASH_LOAN_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("executeFlashLoan", [op.token, op.amount, ops]),
				info: ops.map(it => it.info).join(""),
				in: ops.map(it => it.in).find(it => it !== undefined),
				out: ops.map(it => it.out).find(it => it !== undefined),
			}))
		}
		case "erc20-transfer-from": {
			const impl = Erc20TransferStrategy__factory.createInterface()
			return [{
				position: ERC20_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("transferFrom", [op.token, op.from, op.amount]),
			}]
		}
		case "erc20-transfer-to": {
			const impl = Erc20TransferStrategy__factory.createInterface()
			return [{
				position: ERC20_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("transferTo", [op.token, op.to, op.amount]),
			}]
		}
		case "swap": {
			const impl = SwapStrategy__factory.createInterface()
			const quotes = await fetchAllQuotes(runner, vault, op)
			return quotes.map(quote => ({
				position: getSwapStrategyPosition(quote.ex),
				callData: impl.encodeFunctionData("swap", [op.from, op.to, quote.to, quote.data]),
				info: quote.ex,
				in: quote.in,
				out: quote.out,
			}))
		}
	}
}

function getSwapStrategyPosition(provider: string) {
	switch (provider) {
		case "pendle": return PENDLE_STRATEGY_INDEX
		case "odos-v2": return ODOS_STRATEGY_INDEX
		case "kyberswap-api": return KYBER_STRATEGY_INDEX
		case "strata-swap": return STRATA_STRATEGY_INDEX
		default: throw new Error("Unknown swap strategy provider " + provider)
	}
}

async function fetchAllQuotes(runner: ContractRunner, vaultAddress: address, op: SwapOperation) {
	const { chainId } = await runner.provider!.getNetwork()
	const fromDecimals = getDecimals(op.from)
	const toDecimals = getDecimals(op.to)
	return await getSwaps(
		runner, Number(chainId), vaultAddress, op.amount, op.from as address, op.to as address, op.txOrigin, fromDecimals, toDecimals, op.preferred
	)
}

export function crossJoin<T>(arrays: T[][]): T[][] {
	if (arrays.length === 0) return [[]]

	const firstArray = arrays[0]
	const remainingCombinations = crossJoin(arrays.slice(1))

	return firstArray.flatMap(item =>
		remainingCombinations.map(combination =>
			[item, ...combination]
		)
	)
}
