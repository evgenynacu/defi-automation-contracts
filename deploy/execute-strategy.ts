import { StrategyOperation } from "../common/serialize-operation"
import { ethers } from "hardhat"
import { address } from "../common/types"
import { calculateResult, StrategyExecutor } from "../common/calculate-result"
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ContractTransactionResponse } from "ethers"
import { stringifyWithBigInt } from "../common/stringify"

/**
 * Executes operations using the selected Vault. The main signer is used to sign the transaction
 */
export async function executeStrategy(vaultAddress: address, operations: StrategyOperation[]) {
	if (process.env.DEBUG_OPS) {
		console.log("operations:", stringifyWithBigInt(operations, 2))
	}

	const [signer] = await ethers.getSigners()
	const { result, info, ops, faults, calldata, working } = await calculateResult(ethers.provider, vaultAddress, signer.address as address, operations)

	const vault = await ethers.getContractAt("AutomatedVault", vaultAddress)

	if (process.env.DEBUG_TENDERLY === 'true') {
		const url = `https://dashboard.tenderly.co/${process.env.TENDERLY_USER}/project/simulator/new?stateOverrides=&from=${signer.address}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${vaultAddress}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
		console.log("simulate: \"" + url + "\"")
	}
	console.log("swap faults: " + faults, "best: " + info + " with out " + result, "working: " + working)
	return await vault.rebalance(ops)
}

export async function createSendExecutor(hre: HardhatRuntimeEnvironment, name = "AutomatedVault"): Promise<StrategyExecutor<ContractTransactionResponse>> {
	const vault = await getVaultAddress(hre, name)
	const [signer] = await ethers.getSigners()
	return {
		runner: signer,
		getVaultAddress: () => Promise.resolve(vault),
		getFrom: () => Promise.resolve(signer.address as address),
		execute: (operations: StrategyOperation[]) => executeStrategy(vault, operations),
	}
}

export async function getVaultAddress(hre: HardhatRuntimeEnvironment, name = "AutomatedVault") {
	if (process.env.VAULT) {
		return process.env.VAULT as address
	} else {
		const deployment = await hre.deployments.getOrNull(name)
		if (deployment === undefined || deployment === null) {
			throw new Error("Vault not deployed")
		}
		return deployment.address as address
	}
}

export async function getSignerAddress(): Promise<address> {
	if (process.env.DEBUG_FROM) {
		return process.env.DEBUG_FROM as address
	} else {
		const [signer] = await ethers.getSigners()
		return signer.address as address
	}
}

