import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0x7fd694cd13880ce994c61e8f8991ce0c9e321e3d50f548dd62a1b6e610d29f32", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-cusdo-USDT']
