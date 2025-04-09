import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromMorpho(ex, "0x1eda1b67414336cab3914316cb58339ddaef9e43f939af1fed162a989c98bc20", 1))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-USD0++-USDC']