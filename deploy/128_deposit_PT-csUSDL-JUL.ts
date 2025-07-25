import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "../common/deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0x544b0a093b130a3fb01b72a1279ab848575f049c73da3b5c9c718f9350a1519c", 11000000000n, 8))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-csUSDL-JUL']


//81491.440194928803294008 - 80023.887736 * (1 + 0.0744 * 75 / 365)
//(89292.247754291320031518 - 77000 * (1 + 0.066 * 58 / 365) - 11000) / 11000 * 365/58