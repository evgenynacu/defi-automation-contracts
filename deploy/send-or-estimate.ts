import { createCalculateExecutor, StrategyExecutor } from "../common/calculate-result"
import { createSendExecutor, getSignerAddress, getVaultAddress } from "./execute-strategy"
import { estimateOutput } from "./estimate-output"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { ethers } from "hardhat"

type ExecuteFn = <T>(ex: StrategyExecutor<T>) => Promise<T>

export async function sendOrEstimate(hre: HardhatRuntimeEnvironment, fn: ExecuteFn, name: string = "AutomatedVault") {
	if (process.env.DEBUG_ESTIMATE) {
		const ex = createCalculateExecutor(ethers.provider, await getVaultAddress(hre, name), await getSignerAddress())

		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => fn(ex))
	} else {
		const ex = await createSendExecutor(hre, name)
		await fn(ex)
	}
}