import { HasOperation } from "../typechain-types/contracts/vault/AutomatedVault"
import { ethers } from "hardhat"

export const ERC20_STRATEGY_INDEX = 0
export const SWAP_STRATEGY_INDEX = 1
export const MORPHO_FLASH_LOAN_STRATEGY_INDEX = 2
export const AAVE_FLASH_LOAN_STRATEGY_INDEX = 3
export const COMPOUND_V3_STRATEGY_INDEX = 4

export type TransferErc20FromCallerOperation = {
	'@type': 'erc20-transfer-from-caller'
	token: string
	amount: bigint
}

export type TransferErc20ToCallerOperation = {
	'@type': 'erc20-transfer-to-caller'
	token: string
	amount: bigint
}

export type SwapOperation = {
	'@type': 'swap'
	from: string
	to: string
	amount: bigint
}

type CompoundV3SupplyOperation = {
	'@type': 'compound-v3-supply'
	comet: string
	token: string
	amount: bigint
}

type CompoundV3WithdrawOperation = {
	'@type': 'compound-v3-withdraw'
	comet: string
	token: string
	amount: bigint
}

type CompoundV3BorrowOperation = {
	'@type': 'compound-v3-borrow'
	comet: string
	amount: bigint
}

type CompoundV3RepayOperation = {
	'@type': 'compound-v3-repay'
	comet: string
	amount: bigint
}

type CompoundV3Operation =
	| CompoundV3SupplyOperation
	| CompoundV3WithdrawOperation
	| CompoundV3BorrowOperation
	| CompoundV3RepayOperation

export type MorphoFlashLoanOperation = {
	'@type': 'morpho-flash-loan'
	token: string
	amount: bigint
	innerOperations: InnerStrategyOperation[]
}

export type AaveFlashLoanOperation = {
	'@type': 'aave-flash-loan'
	token: string
	amount: bigint
	innerOperations: InnerStrategyOperation[]
}

type InnerStrategyOperation =
	| TransferErc20FromCallerOperation
	| TransferErc20ToCallerOperation
	| SwapOperation
	| CompoundV3Operation

export type StrategyOperation =
	| InnerStrategyOperation
	| MorphoFlashLoanOperation
	| AaveFlashLoanOperation

export async function toOperation(op: StrategyOperation): Promise<HasOperation.OperationStruct> {
	switch (op['@type']) {
		case "compound-v3-supply": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return {
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("supplyCollateralToCaller", [op.comet, op.token, op.amount])
			}
		}
		case "compound-v3-withdraw": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return {
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("withdrawCollateralFromCaller", [op.comet, op.token, op.amount])
			}
		}
		case "compound-v3-borrow": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return {
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("borrowBaseTokenFromCaller", [op.comet, op.amount])
			}
		}
		case "compound-v3-repay": {
			const impl = (await ethers.getContractFactory("CompoundV3Strategy")).interface
			return {
				position: COMPOUND_V3_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("repayBaseTokenToCaller", [op.comet, op.amount])
			}
		}
		case "morpho-flash-loan": {
			const impl = (await ethers.getContractFactory("MorphoFlashLoanStrategy")).interface
			const innerOperations: HasOperation.OperationStruct[] = await Promise.all(op.innerOperations.map(toOperation))
			return {
				position: MORPHO_FLASH_LOAN_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("executeFlashLoan", [op.token, op.amount, innerOperations])
			}
		}
		case "aave-flash-loan": {
			const impl = (await ethers.getContractFactory("AaveFlashLoanStrategy")).interface
			const innerOperations: HasOperation.OperationStruct[] = await Promise.all(op.innerOperations.map(toOperation))
			return {
				position: AAVE_FLASH_LOAN_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("executeFlashLoan", [op.token, op.amount, innerOperations])
			}
		}
		case "erc20-transfer-from-caller": {
			const impl = (await ethers.getContractFactory("Erc20TransferStrategy")).interface
			return {
				position: ERC20_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("transferFromCaller", [op.token, op.amount])
			}
		}
		case "erc20-transfer-to-caller": {
			const impl = (await ethers.getContractFactory("Erc20TransferStrategy")).interface
			return {
				position: ERC20_STRATEGY_INDEX,
				callData: impl.encodeFunctionData("transferToCaller", [op.token, op.amount])
			}
		}
		case "swap": {
			return {
				position: SWAP_STRATEGY_INDEX,
				callData: "",
			}
		}
	}
}