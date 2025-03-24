import { HasOperation } from "../typechain-types/contracts/vault/AutomatedVault"
import { ethers } from "hardhat"
import { address } from "./types"
import { getSwaps } from "./swap/swap"

export const ERC20_STRATEGY_INDEX = 0
export const SWAP_STRATEGY_INDEX = 1
export const MORPHO_FLASH_LOAN_STRATEGY_INDEX = 2
export const AAVE_FLASH_LOAN_STRATEGY_INDEX = 3
export const COMPOUND_V3_STRATEGY_INDEX = 4
export const MORPHO_STRATEGY_INDEX = 5

export type TransferErc20FromCallerOperation = {
	type: 'erc20-transfer-from-caller'
	token: string
	amount: bigint
}

export type TransferErc20ToCallerOperation = {
	type: 'erc20-transfer-to-caller'
	token: string
	amount: bigint
}

export type SwapOperation = {
	type: 'swap'
	from: string
	to: string
	amount: bigint
}

type CompoundV3SupplyOperation = {
	type: 'compound-v3-supply'
	comet: string
	token: string
	amount: bigint
}

type CompoundV3WithdrawOperation = {
	type: 'compound-v3-withdraw'
	comet: string
	token: string
	amount: bigint
}

type CompoundV3BorrowOperation = {
	type: 'compound-v3-borrow'
	comet: string
	amount: bigint
}

type CompoundV3RepayOperation = {
	type: 'compound-v3-repay'
	comet: string
	amount: bigint
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
}

export type MorphoWithdrawOperation = {
	type: 'morpho-withdraw'
	marketId: string
	amount: bigint
}

export type MorphoBorrowOperation = {
	type: 'morpho-borrow'
	marketId: string
	amount: bigint
}

export type MorphoRepayOperation = {
	type: 'morpho-repay'
	marketId: string
	assets: bigint
	shares: bigint
}

type MorphoOperation =
	| MorphoSupplyOperation
	| MorphoWithdrawOperation
	| MorphoBorrowOperation
	| MorphoRepayOperation

export type MorphoFlashLoanOperation = {
	type: 'morpho-flash-loan'
	token: string
	amount: bigint
	innerOperations: InnerStrategyOperation[]
}

export type AaveFlashLoanOperation = {
	type: 'aave-flash-loan'
	token: string
	amount: bigint
	innerOperations: InnerStrategyOperation[]
}

type InnerStrategyOperation =
	| TransferErc20FromCallerOperation
	| TransferErc20ToCallerOperation
	| SwapOperation
	| CompoundV3Operation
	| MorphoOperation

export type StrategyOperation =
	| InnerStrategyOperation
	| MorphoFlashLoanOperation
	| AaveFlashLoanOperation

export async function serializeOperations(vault: address, ops: StrategyOperation[]): Promise<OperationWithInfo[][]> {
	const serializedOps = await Promise.all(ops.map(op => serializeOperation(vault, op)))
	return crossJoin(serializedOps)
}

export type OperationWithInfo = HasOperation.OperationStruct & {
	info: string
}

/**
 * Serialized op
 * @param vault vault which will execute any swap operation (needed to generate correct calldata for swapping)
 * @param op operation to serialize
 * @return Array of possible operations
 */
async function serializeOperation(vault: address, op: StrategyOperation): Promise<OperationWithInfo[]> {
	const [signer] = await ethers.getSigners()
	const from = signer.address
	switch (op["type"]) {
		case "morpho-supply": {
			const impl = (await ethers.getContractFactory("MorphoStrategy")).interface
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("supplyCollateral", [op.marketId, from, op.amount]),
				info: "",
			}]
		}
		case "morpho-withdraw": {
			const impl = (await ethers.getContractFactory("MorphoStrategy")).interface
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("withdrawCollateral", [op.marketId, from, op.amount]),
				info: "",
			}]
		}
		case "morpho-borrow": {
			const impl = (await ethers.getContractFactory("MorphoStrategy")).interface
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("borrowFromMarket", [op.marketId, from, op.amount]),
				info: "",
			}]
		}
		case "morpho-repay": {
			const impl = (await ethers.getContractFactory("MorphoStrategy")).interface
			return [{
				position: MORPHO_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("repayDebt", [op.marketId, from, op.assets, op.shares]),
				info: "",
			}]
		}
		case "compound-v3-supply": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("supplyCollateral", [op.comet, from, op.token, op.amount]),
				info: "",
			}]
		}
		case "compound-v3-withdraw": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("withdrawCollateral", [op.comet, from, op.token, op.amount]),
				info: "",
			}]
		}
		case "compound-v3-borrow": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("borrowBaseToken", [op.comet, from, op.amount]),
				info: "",
			}]
		}
		case "compound-v3-repay": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return [{
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("repayBaseToken", [op.comet, from, op.amount]),
				info: "",
			}]
		}
		case "morpho-flash-loan": {
			const impl = (await ethers.getContractFactory("MorphoFlashLoanStrategy")).interface
			const innerOperations = await Promise.all(op.innerOperations.map(it => serializeOperation(vault, it)))
			const crossJoined = crossJoin(innerOperations)
			return crossJoined.map(ops => ({
				position: MORPHO_FLASH_LOAN_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("executeFlashLoan", [op.token, op.amount, ops]),
				info: ops.map(it => it.info).join("")
			}))
		}
		case "aave-flash-loan": {
			const impl = (await ethers.getContractFactory("AaveFlashLoanStrategy")).interface
			const innerOperations = await Promise.all(op.innerOperations.map(it => serializeOperation(vault, it)))
			const crossJoined = crossJoin(innerOperations)
			return crossJoined.map(ops => ({
				position: AAVE_FLASH_LOAN_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("executeFlashLoan", [op.token, op.amount, ops]),
				info: ops.map(it => it.info).join("")
			}))
		}
		case "erc20-transfer-from-caller": {
			const impl = (await ethers.getContractFactory("Erc20TransferStrategy")).interface
			return [{
				position: ERC20_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("transferFrom", [op.token, from, op.amount]),
				info: "",
			}]
		}
		case "erc20-transfer-to-caller": {
			const impl = (await ethers.getContractFactory("Erc20TransferStrategy")).interface
			return [{
				position: ERC20_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("transferTo", [op.token, from, op.amount]),
				info: "",
			}]
		}
		case "swap": {
			const impl = (await ethers.getContractFactory("SwapStrategy")).interface
			const quotes = await fetchAllQuotes(vault, op)
			return quotes.map(quote => ({
				position: SWAP_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("swap", [op.from, op.to, quote.to, quote.data]),
				info: quote.ex
			}))
		}
	}
}

async function fetchAllQuotes(vaultAddress: address, op: SwapOperation) {
	const { chainId } = await ethers.provider.getNetwork()
	const [signer] = await ethers.getSigners()
	const fromToken = await ethers.getContractAt("ERC20", op.from)
	const toToken = await ethers.getContractAt("ERC20", op.to)
	const fromDecimals = Number(await fromToken.decimals())
	const toDecimals = Number(await toToken.decimals())
	return await getSwaps(
		Number(chainId), vaultAddress, op.amount, op.from as address, op.to as address, signer.address as address, fromDecimals, toDecimals
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
