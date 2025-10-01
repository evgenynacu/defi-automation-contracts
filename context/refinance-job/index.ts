import dotenv from "dotenv"
import {getSupplyCaps} from "../aave"
import {ContractTransactionResponse, ethers, Wallet} from "ethers"
import {PT_USDe_SEP, USDT_ADDRESS} from "../../common/addresses"
import {calculateResult, StrategyExecutor} from "../../common/calculate-result"
import {address, StateDiff, toAddress, toHex} from "../../common/types"
import {StrategyOperation} from "../../common/serialize-operation"
import {stringifyWithBigInt} from "../../common/stringify"
import {AutomatedVault__factory} from "../../typechain-types"
import {Morpho} from "../../common/lending/morpho"
import {Aave} from "../../common/lending/aave"
import {refinance} from "../../common/refinance"
import {logAsync} from "../../common/log-async"
import {createGasTool, GasTool} from "../gas-tool";

dotenv.config()

async function refinanceJob() {
	const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!)
	console.log("executing txs from", wallet.address)
	const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com")
	const signer = wallet.connect(provider)
	const gasTool = createGasTool(provider)

	const vault = toAddress(process.env.VAULT_ADDRESS || "0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb")
	const executor = createSendExecutor(signer, gasTool, {
			[vault]: {
				stateDiff: {
					[toHex("0xc0a9f5df74bfbfe117443d538f7d3a01e944270ac4e50786d0f393ade43fe98f")]: toHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
				},
			},
			[toAddress("0x38A5357Ce55c81add62aBc84Fb32981e2626ADEf")]: {
				stateDiff: {
					[toHex("0x0000000000000000000000000000000000000000000000000000000000000036")]: toHex("0x0000000000000000000000000000000000000000013adf4b7320334b90000000"),
				}
			}
		}
	)
	const morpho = new Morpho("0xb0a9ac81a8c6a5274aa1a8337aed35a2cb2cd4feb5c6d3b39d41f234fbf2955b", "0xEbca6F665A80466f410B3c2FD5a1696eDB664A42")
	const aave = new Aave(PT_USDe_SEP, USDT_ADDRESS)

	const id = setInterval(() => {
		logAsync(checkAndRefinance(id, signer, morpho, aave, executor, gasTool), "checkAndRefinance").then()
	}, 6000)
}

async function checkAndRefinance(id: NodeJS.Timeout, signer: Wallet, morpho: Morpho, aave: Aave, executor: StrategyExecutor<ContractTransactionResponse>, gasTool: GasTool) {
	const gasSettings = await gasTool()
	console.log("executing with gas", gasSettings)

	const { collateralToWithdraw } = await morpho.initWithdraw(executor, 1, 1)
	const collateralNumber = Number(collateralToWithdraw / (10n ** 18n))
	console.log("collateral", collateralNumber)
	if (collateralNumber == 0) {
		console.log("no collateral left")
		clearInterval(id)
	}

	const cap = await getSupplyCaps(signer, PT_USDe_SEP, "0x38A5357Ce55c81add62aBc84Fb32981e2626ADEf")
	console.log("available cap", cap.available)

	if (cap.available > 100000) {
		console.log("Cap is ok, proceeding to refinance")
		const share = Math.min(1, 0.95 * (cap.available / collateralNumber))
		console.log("share is", share)

		const tx = await refinance(executor, morpho, aave, share)
		console.log("sent", tx)
		const receipt = await tx.wait()
		console.log("receipt", receipt)
		console.log("---------------------------------------------------------")
	} else {
		console.log("Cap is too low, waiting for it to increase")
		console.log("---------------------------------------------------------")
	}
}

function createSendExecutor(signer: Wallet, gasTool: GasTool, stateDiff: StateDiff = {}): StrategyExecutor<ContractTransactionResponse> {
	const vault = toAddress(process.env.VAULT_ADDRESS || "0x45BeD3404b87b30fEF2A6EE679aa50178072bAbb")
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


refinanceJob().then()