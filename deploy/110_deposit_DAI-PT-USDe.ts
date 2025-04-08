import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => depositToMorpho(hre, "0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905", 6000000000n, 6.5, true))
	} else {
		await depositToMorpho(hre, "0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905", 11927638348240259121152n, 6.5, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-DAI-PT-USDe']