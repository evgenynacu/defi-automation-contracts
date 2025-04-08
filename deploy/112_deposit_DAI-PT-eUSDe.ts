import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => depositToMorpho(hre, "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1", 11712310443000000000000n, 7.5, true))
	} else {
		await depositToMorpho(hre, "0xae4571cdcad4191b9a59d1bb27a10a1b05c92c84fe423e4886d5781a30a9c8f1", 11712310443000000000000n, 7.5, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-DAI-PT-eUSDe']

