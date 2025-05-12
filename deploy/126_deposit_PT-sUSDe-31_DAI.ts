import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef", 29991721061999999999999n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDe-DAI-JUL']
