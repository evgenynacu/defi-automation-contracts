import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { estimateOutput } from "./estimate-output"
import { createCalculateExecutor } from "../common/calculate-result"
import { createSendExecutor, getSignerAddress, getVaultAddress } from "./execute-strategy"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const ex = createCalculateExecutor(ethers.provider, await getVaultAddress(hre), await getSignerAddress())

		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => withdrawFromMorpho(ex, "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1", 1).then(r => r.result))
	} else {
		const ex = await createSendExecutor(hre)
		await withdrawFromMorpho(ex, "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1", 1)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-DAI-PT-eUSDe']