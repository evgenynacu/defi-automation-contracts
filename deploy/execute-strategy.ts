import { StrategyOperation } from "./to-operation"
import { ethers } from "hardhat"
import { findBestSwap } from "./find-best-swap"

export async function executeStrategy(vaultAddress: string, operations: StrategyOperation[]) {
	const serializedOperations = await findBestSwap(operations)
	const vault = await ethers.getContractAt("AutomatedVault", vaultAddress)

	const calldata = vault.interface.encodeFunctionData("rebalance", [serializedOperations])
	console.log("vault is", vaultAddress, "executing: ", calldata)
	await vault.rebalance(serializedOperations)
}

