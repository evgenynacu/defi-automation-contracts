import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from "hardhat"
import { withdrawFromMorpho } from "./withdraw-from-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => withdrawFromMorpho(hre, "0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905", 1, true))
	} else {
		await withdrawFromMorpho(hre, "0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905", 1, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-DAI-PT-USDe']