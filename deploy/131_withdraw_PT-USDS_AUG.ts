import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0xa458018cf1a6e77ebbcc40ba5776ac7990e523b7cc5d0c1e740a4bbc13190d8f", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-USDS-AUG']