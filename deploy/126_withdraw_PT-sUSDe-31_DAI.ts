import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0xb81eaed0df42ff6646c8daf4fe38afab93b13b6a89c9750d08e705223a45e2ef", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-sUSDe-DAI-JUL']