import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0xbfed072faee09b963949defcdb91094465c34c6c62d798b906274ef3563c9cac", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-srUSD-USDC']