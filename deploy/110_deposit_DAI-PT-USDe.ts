import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0x407d8c123443d362ffdfe73208068ef158a21d1a44a988c9acc23a51bade7905", 11927638348240259121152n, 6.5))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-DAI-PT-USDe']

//11927.638348240259121152 +