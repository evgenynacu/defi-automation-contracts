import { OperationWithInfo, serializeOperations, StrategyOperation } from "./serialize-operation"
import { address } from "./types"
import { AutomatedVault, AutomatedVault__factory } from "../typechain-types"
import { type ContractRunner, AbiCoder } from "ethers"

/**
 * Tries to simulate execution of operations using chosen vault and chose tx signer
 * Chooses best exchange based on the output of swap operation (best value is used)
 * @return best result and exact operations to get this output
 */
export async function calculateResult(runner: ContractRunner, vaultAddress: address, from: address, operations: StrategyOperation[]): Promise<CalculateResult> {
	const possibleOperations = await serializeOperations(runner, from, vaultAddress, operations)
	const vault = AutomatedVault__factory.connect(vaultAddress, runner)

	const results = await Promise.all(possibleOperations.map(ops => callAndGetOut(runner, from, vault, ops)))
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

async function callAndGetOut(runner: ContractRunner, from: string, vault: AutomatedVault, ops: OperationWithInfo[]): Promise<OutResult> {
	const info = ops.map(it => it.info).join("")
	const calldata = vault.interface.encodeFunctionData("rebalance", [ops])
	if (process.env.DEBUG_CALLDATA && info === process.env.DEBUG_CALLDATA) {
		const vaultAddress = await vault.getAddress()
		const url = `https://dashboard.tenderly.co/eugenenacu/project/simulator/new?stateOverrides=&from=${from}&rawFunctionInput=${calldata}&simulationId=&value=0&contractAddress=${vaultAddress}&contractFunction=&functionInputs=&network=1&headerBlockNumber=&headerTimestamp=`
		console.log(info, "testing url: \"" + url + "\" ")
	}
	try {
		const result = await runner.call!({
			to: vault,
			from,
			data: calldata
		})
		const coder = new AbiCoder()
		const parsed = coder.decode(["uint256"], result)
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

type CalculateResult = Omit<OutOkResult, "ok"> & {
	faults: string[]
}

type OutResult = OutOkResult | OutErrorResult

type OutOkResult = {
	info: string
	result: bigint
	ok: true
	ops: OperationWithInfo[]
	calldata: string
}

type OutErrorResult = {
	info: string
	ok: false
}

export type StrategyExecutor<T> = {
	runner: ContractRunner
	execute(operations: StrategyOperation[]): Promise<T>
	getFrom(): Promise<address>
	getVaultAddress(): Promise<address>
}

export function createCalculateExecutor(runner: ContractRunner, vaultAddress: address, from: address): StrategyExecutor<CalculateResult> {
	return {
		runner,
		execute: (operations) => calculateResult(runner, vaultAddress, from, operations),
		getFrom: () => Promise.resolve(from),
		getVaultAddress: () => Promise.resolve(vaultAddress)
	}
}