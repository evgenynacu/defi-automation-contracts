import { OperationWithInfo, serializeOperations, StrategyOperation } from "./serialize-operation"
import { ethers } from "hardhat"
import { address } from "./types"
import { AutomatedVault } from "../typechain-types"
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function executeStrategy(vaultAddress: address, operations: StrategyOperation[], estimateOnly: boolean = false) {
	const from = await getSignerAddress()
	if (estimateOnly) {
		const { result } = await calculateResult(vaultAddress, from, operations)
		return result
	}
	if (process.env.DEBUG_FROM) {
		console.log("DEBUG_FROM is set, but not estimating")
	}

	const { result, info, ops, faults, calldata } = await calculateResult(vaultAddress, from, operations)

	const [sender] = await ethers.getSigners()
	const vault = await ethers.getContractAt("AutomatedVault", vaultAddress)

	if (process.env.DEBUG_TENDERLY === 'true') {
		const url = `https://dashboard.tenderly.co/eugenenacu/project/simulator/new?stateOverrides=&from=${sender.address}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${vaultAddress}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
		console.log("simulate: \"" + url + "\"")
	}
	console.log("swap faults: " + faults, "best: " + info + " with out " + result)
	return await vault.rebalance(ops)
}

async function calculateResult(vaultAddress: address, from: address, operations: StrategyOperation[]) {
	const possibleOperations = await serializeOperations(from, vaultAddress, operations)
	const vault = await ethers.getContractAt("AutomatedVault", vaultAddress)

	const results = await Promise.all(possibleOperations.map(ops => executeAndGetOut(from, vault, ops)))
	const faults = results.filter(it => !it.ok).map(it => it.info)
	const sorted = results
		.filter(it => it.ok)
		.sort((a, b) => a.result === b.result ? 0 : a.result > b.result ? -1 : 1
		)

	if (sorted.length > 0) {
		const best = sorted[0]
		return {
			result: best.result,
			info: best.info,
			ops: best.ops,
			calldata: best.calldata,
			faults,
		}
	} else {
		throw new Error("No results. faults: " + faults.join(","))
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

async function executeAndGetOut(from: string, vault: AutomatedVault, ops: OperationWithInfo[]): Promise<OutResult> {
	const info = ops.map(it => it.info).join("")
	const calldata = vault.interface.encodeFunctionData("rebalance", [ops])
	if (process.env.DEBUG_CALLDATA && info === process.env.DEBUG_CALLDATA) {
		const vaultAddress = await vault.getAddress()
		const url = `https://dashboard.tenderly.co/eugenenacu/project/simulator/new?stateOverrides=&from=${from}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${vaultAddress}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
		console.log(info, "testing url: \"" + url + "\" ")
	}
	try {
		const result = await ethers.provider.call({
			to: vault,
			from,
			data: calldata
		})
		const parsed = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result)
		return {
			ok: true,
			info,
			result: parsed[0] as bigint,
			calldata: calldata,
			ops,
		}
	} catch (e) {
		return {
			ok: false,
			info,
		}
	}
}

type OutResult = {
	info: string
} & ({ result: bigint, ok: true, ops: OperationWithInfo[], calldata: string } | { ok: false })