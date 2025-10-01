import dotenv from "dotenv";
import {ContractTransactionResponse, ethers, Wallet} from "ethers";
import {createGasTool, GasTool} from "../gas-tool";
import {address, StateDiff, toAddress} from "../../common/types";
import {Aave} from "../../common/lending/aave";
import {sUSDe_ADDRESS, USDC} from "../../common/addresses";
import {calculateResult, StrategyExecutor} from "../../common/calculate-result";
import {StrategyOperation} from "../../common/serialize-operation";
import {stringifyWithBigInt} from "../../common/stringify";
import {AutomatedVault__factory} from "../../typechain-types";
import {logAsync} from "../../common/log-async";
import {withdraw} from "../../common/withdraw";

dotenv.config()

async function takeProfitJob() {
	const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!)
	console.log("executing txs from", wallet.address)
	const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
	const signer = wallet.connect(provider)
	const gasTool = createGasTool(provider)

	const executor = createSendExecutor(signer, gasTool)
	const aave = new Aave(sUSDe_ADDRESS, USDC)

	const id = setInterval(() => {
		logAsync(checkAndTakeProfit(id, signer, aave, executor, gasTool), "checkAndRefinance").then()
	}, 6000)

}

async function checkAndTakeProfit(id: NodeJS.Timeout, signer: Wallet, aave: Aave, ex: StrategyExecutor<ContractTransactionResponse>, gasTool: GasTool) {
	const gasSettings = await gasTool()
	console.log("executing with gas", gasSettings, "at", new Date().toISOString())

	await withdraw({
		ex,
		lending: aave,
		recipient: "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42",
		amount: 314000000000n,
	})
}

function createSendExecutor(signer: Wallet, gasTool: GasTool, stateDiff: StateDiff = {}): StrategyExecutor<ContractTransactionResponse> {
	const vault = toAddress(process.env.VAULT_ADDRESS || "0x7286fb0a79BEF605c5BF63B65Ce9607CBB26d502")
	return {
		runner: signer,
		getVaultAddress: () => Promise.resolve(vault),
		getFrom: () => Promise.resolve(toAddress(signer.address)),
		execute: (operations: StrategyOperation[]) => executeStrategy(signer, vault, operations, gasTool, stateDiff),
	}
}

async function executeStrategy(signer: Wallet, vaultAddress: address, operations: StrategyOperation[], gasTool: GasTool, stateDiff: StateDiff = {}) {
	if (process.env.DEBUG_OPS) {
		console.log("operations:", stringifyWithBigInt(operations, 2))
	}

	const {
		result,
		info,
		ops,
		faults,
		working
	} = await calculateResult(signer.provider!, vaultAddress, toAddress(signer.address), operations, stateDiff)
	console.log("calculate result", result)

	const vault = AutomatedVault__factory.connect(vaultAddress, signer)

	console.log("swap faults: " + faults, "best: " + info + " with out " + result, "working: " + working)
	const gasSettings = await gasTool()
	console.log("executing with gas", gasSettings)
	return await vault.rebalance(ops, gasSettings)
}

takeProfitJob().then()