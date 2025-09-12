import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0x8cdb63a27a48ac27fadc0f158a732104bcc4e10bb61c9a5095ea7c127204e26c", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-USDE-NOV-25']