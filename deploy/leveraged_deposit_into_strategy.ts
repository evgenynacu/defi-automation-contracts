import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import {
	AutomatedVault,
	USdsStrategy,
	CompoundV3Strategy,
	MorphoFlashLoanStrategy,
} from '../typechain-types';
import { HasOperation } from "../typechain-types/contracts/vault/AutomatedVault"

/**
 * Creates a leveraged deposit into sUSDS using a flash loan
 *
 * @param {bigint} amount - The base amount of USDS owned by the vault
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
	console.log(`Setting up leveraged deposit with ${ethers.formatUnits(amount)} USDS at ${leverage}x leverage`);

	// Strategy indices in the vault
	const USds_STRATEGY_INDEX = 0;      // USdsStrategy
	const COMPOUND_STRATEGY_INDEX = 1;  // CompoundV3Strategy
	const MORPHO_STRATEGY_INDEX = 2;    // MorphoFlashLoanStrategy

	// Load the vault contract using TypeChain
	const vault = (await ethers.getContractAt("AutomatedVault", vaultAddress, signer)) as AutomatedVault;

	// Get strategy addresses from the vault
	const strategies = await vault.getStrategies();
	const usdsStrategyAddress = strategies[USds_STRATEGY_INDEX];
	const compoundStrategyAddress = strategies[COMPOUND_STRATEGY_INDEX];
	const morphoStrategyAddress = strategies[MORPHO_STRATEGY_INDEX];

	// Load strategy contracts using TypeChain
	const usdsStrategy = (await ethers.getContractAt("USdsStrategy", usdsStrategyAddress, signer)) as USdsStrategy;
	const compoundStrategy = (await ethers.getContractAt("CompoundV3Strategy", compoundStrategyAddress, signer)) as CompoundV3Strategy;
	const morphoStrategy = (await ethers.getContractAt("MorphoFlashLoanStrategy", morphoStrategyAddress, signer)) as MorphoFlashLoanStrategy;

	// Get the USDS address from the USdsStrategy
	const usdsAddress = await usdsStrategy.USDS_TOKEN();

	// Get the sUSDS address from the USdsStrategy
	const sUsdsAddress = await usdsStrategy.S_USDS_TOKEN();

	// Calculate flash loan amount (leverage - 1) * amount
	const flashLoanAmount = amount * BigInt(10000) * BigInt(leverage - 1) / BigInt(10000)
	console.log(`Flash loan amount: ${ethers.formatUnits(flashLoanAmount)} USDS`);

	// Total amount after flash loan = amount + flashLoanAmount
	const totalAmount = amount + flashLoanAmount
	console.log(`Total amount to deposit: ${ethers.formatUnits(totalAmount)} USDS`);

	// Create operations for rebalance using TypeChain interfaces

	// 1. Encode the operation to deposit into sUSDS (on USdsStrategy)
	const depositCallData = usdsStrategy.interface.encodeFunctionData("depositUSDS", [totalAmount]);

	// 2. Encode the operation to supply sUSDS as collateral on Compound
	const MAX_UINT = ethers.MaxUint256;
	const supplyCollateralCallData = compoundStrategy.interface.encodeFunctionData(
		"supplyCollateral",
		[sUsdsAddress, MAX_UINT]
	);


	// 3. Encode borrowing USDS (same amount as flash loan)
	const borrowCallData = compoundStrategy.interface.encodeFunctionData(
		"borrowBaseToken",
		[flashLoanAmount]
	);

	// Define the operations that will be executed after the flash loan
	const innerOperations: HasOperation.OperationStruct[]= [
		{ position: USds_STRATEGY_INDEX, callData: depositCallData },
		{ position: COMPOUND_STRATEGY_INDEX, callData: supplyCollateralCallData },
		{ position: COMPOUND_STRATEGY_INDEX, callData: borrowCallData }
	];

	// Final flash loan call data
	const flashLoanCallData = morphoStrategy.interface.encodeFunctionData(
		"executeFlashLoan",
		[usdsAddress, flashLoanAmount, innerOperations]
	);

	// Create the operation for the flash loan
	const operations: HasOperation.OperationStruct[] = [
		{ position: MORPHO_STRATEGY_INDEX, callData: flashLoanCallData }
	];

	// Execute rebalance with the operations
	// maxIterations = 1, slippageParamsBps = 0 (not applicable for this strategy)
	const data = vault.interface.encodeFunctionData("rebalance", [1, 0, operations])
	console.log("sending tx: ", data)
	const tx = await vault.rebalance(1, 0, operations);

	console.log(`Leveraged deposit transaction submitted: ${tx.hash}`);
}

// Example usage:
/*
import { ethers } from 'hardhat';

async function main() {
  const [signer] = await ethers.getSigners();
  const vaultAddress = '0xYourVaultAddress';
  const amount = ethers.utils.parseUnits('1000', 18); // 1000 USDS, assuming 18 decimals
  const leverage = 2; // 2x leverage

  await depositIntoStrategy(amount, leverage, vaultAddress, signer);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
*/