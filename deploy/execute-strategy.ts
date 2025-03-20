import { OperationWithInfo, serializeOperations, StrategyOperation } from "./serialize-operation"
import { ethers } from "hardhat"
import { address } from "./types"
import { AutomatedVault } from "../typechain-types"

export async function executeStrategy(vaultAddress: address, operations: StrategyOperation[]) {

	const possibleOperations = await serializeOperations(vaultAddress, operations)
	const [sender] = await ethers.getSigners()
	const vault = await ethers.getContractAt("AutomatedVault", vaultAddress)

	const results = await Promise.all(possibleOperations.map(ops => executeAndGetOut(sender.address, vault, ops)))
	const faults = results.filter(it => !it.ok).map(it => it.info)
	const sorted = results
		.filter(it => it.ok)
		.sort((a, b) => a.result === b.result ? 0 : a.result > b.result ? -1 : 1
		)
	if (sorted.length > 0) {
		console.log("swap faults: " + faults, "best: " + sorted[0].info + " with out " + sorted[0].result)
		const url = `https://dashboard.tenderly.co/eugenenacu/project/simulator/new?stateOverrides=&from=${sender.address}&rawFunctionInput=${sorted[0].calldata}&simulationId=&value=0&contractAddress=${vaultAddress}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
		console.log("simulate: \"" + url + "\"")
		const bestOps = sorted[0].ops
		await vault.rebalance(bestOps)
	} else {
		throw new Error("No results. faults: " + faults.join(","))
	}
}

async function executeAndGetOut(from: string, vault: AutomatedVault, ops: OperationWithInfo[]): Promise<OutResult> {
	const info = ops.map(it => it.info).join("")
	const calldata = vault.interface.encodeFunctionData("rebalance", [ops])
	if (info === "enso") {
		const vaultAddress = await vault.getAddress()
		const url =	`https://dashboard.tenderly.co/eugenenacu/project/simulator/new?stateOverrides=&from=${from}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${vaultAddress}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
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