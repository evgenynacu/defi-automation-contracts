import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "./withdraw-from-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => withdrawFromMorpho(hre, "0xcfe8238ad5567886652ced15ee29a431c161a5904e5a6f380baaa1b4fdc8e302", 1, true))
	} else {
		await withdrawFromMorpho(hre, "0xcfe8238ad5567886652ced15ee29a431c161a5904e5a6f380baaa1b4fdc8e302", 1, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-wstUSR']