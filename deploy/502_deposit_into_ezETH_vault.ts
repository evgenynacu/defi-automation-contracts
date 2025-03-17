import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import { AutomatedVault, CompoundV3Strategy, MorphoFlashLoanStrategy, RenzoStrategy, } from '../typechain-types'
import { HasOperation } from "../typechain-types/contracts/vault/AutomatedVault"

const EZETH_ADDRESS = "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110"
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

/**
 * Creates a leveraged deposit using a flash loan
 *
 * @param {bigint} amount - The base amount of token owned by the vault
 * @param {number} leverage - The desired leverage factor (e.g., 2 = 2x leverage)
 * @param {string} vaultAddress - The address of the AutomatedVault
 * @param {Signer} signer - The signer authorized as an operator of the vault
 */
export async function depositIntoStrategy(
	amount: bigint,
	leverage: number,
	vaultAddress: string,
	signer: Signer
) {
	console.log(`Setting up leveraged deposit with ${ethers.formatUnits(amount)} at ${leverage}x leverage`)

	// Strategy indices in the vault
	const RENZO_STRATEGY_INDEX = 0      // RenzoStrategy
	const COMPOUND_STRATEGY_INDEX = 1  // CompoundV3Strategy
	const MORPHO_STRATEGY_INDEX = 2    // MorphoFlashLoanStrategy

	// Load the vault contract using TypeChain
	const vault = (await ethers.getContractAt("AutomatedVault", vaultAddress, signer)) as AutomatedVault

	// Get strategy addresses from the vault
	const strategies = await vault.getStrategies()
	const renzoStrategyAddress = strategies[RENZO_STRATEGY_INDEX]
	const compoundStrategyAddress = strategies[COMPOUND_STRATEGY_INDEX]
	const morphoStrategyAddress = strategies[MORPHO_STRATEGY_INDEX]

	// Load strategy contracts using TypeChain
	const renzoStrategy = (await ethers.getContractAt("RenzoStrategy", renzoStrategyAddress, signer)) as RenzoStrategy
	const compoundStrategy = (await ethers.getContractAt("CompoundV3Strategy", compoundStrategyAddress, signer)) as CompoundV3Strategy
	const morphoStrategy = (await ethers.getContractAt("MorphoFlashLoanStrategy", morphoStrategyAddress, signer)) as MorphoFlashLoanStrategy

	// Calculate flash loan amount (leverage - 1) * amount
	const flashLoanAmount = amount * BigInt(10000 * (leverage - 1)) / BigInt(10000)
	console.log(`Flash loan amount: ${ethers.formatUnits(flashLoanAmount)}`)

	// Total amount after flash loan = amount + flashLoanAmount
	const totalAmount = amount + flashLoanAmount
	console.log(`Total amount to deposit: ${ethers.formatUnits(totalAmount)}`)

	// Create operations for rebalance using TypeChain interfaces

	const depositCallData = renzoStrategy.interface.encodeFunctionData("depositEth", [totalAmount])

	// 2. Encode the operation to supply ezETH as collateral on Compound
	const MAX_UINT = ethers.MaxUint256
	console.log("Using ezETH address: ", EZETH_ADDRESS)
	const supplyCollateralCallData = compoundStrategy.interface.encodeFunctionData(
		"supplyCollateral",
		[EZETH_ADDRESS, MAX_UINT]
	)


	// 3. Encode borrowing WETH (same amount as flash loan)
	const borrowAmount = flashLoanAmount
	console.log("Borrowing amount: ", borrowAmount)
	const borrowCallData = compoundStrategy.interface.encodeFunctionData(
		"borrowBaseToken",
		[borrowAmount]
	)

	// Define the operations that will be executed after the flash loan
	const innerOperations: HasOperation.OperationStruct[] = [
		{ position: RENZO_STRATEGY_INDEX, callData: depositCallData },
		{ position: COMPOUND_STRATEGY_INDEX, callData: supplyCollateralCallData },
		{ position: COMPOUND_STRATEGY_INDEX, callData: borrowCallData }
	]

	// Final flash loan call data
	const flashLoanCallData = morphoStrategy.interface.encodeFunctionData(
		"executeFlashLoan",
		[WETH_ADDRESS, flashLoanAmount, innerOperations]
	)

	// Create the operation for the flash loan
	const operations: HasOperation.OperationStruct[] = [
		{ position: MORPHO_STRATEGY_INDEX, callData: flashLoanCallData }
	]

	// Execute rebalance with the operations
	// maxIterations = 1, slippageParamsBps = 0 (not applicable for this strategy)
	const lastRebalanceTimestamp = await vault.lastRebalanceTimestamp()
	const data = vault.interface.encodeFunctionData("rebalance", [lastRebalanceTimestamp + 1n, 0, operations])
	console.log("sending tx: ", data)
	const tx = await vault.rebalance(lastRebalanceTimestamp + 1n, 0, operations)

	console.log(`Leveraged deposit transaction submitted: ${tx.hash}`)
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const [deployer] = await ethers.getSigners()

	console.log("Depositing funds using", deployer.address)
	await depositIntoStrategy(5000000000000000000n, 7.5, "0xEe53FB92669D19c6C9DB2ae7eFbe9fE9521FdE54", deployer)
}

// Add tags for selective deployment
func.tags = ['deposit-into-vault', 'deposit-into-ezeth-vault', 'ethereum-mainnet']
func.dependencies = [] // No dependencies for this deployment

export default func