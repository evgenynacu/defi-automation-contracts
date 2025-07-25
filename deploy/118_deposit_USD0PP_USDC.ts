import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "../common/deposit-to-morpho"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToMorpho(ex, "0x1eda1b67414336cab3914316cb58339ddaef9e43f939af1fed162a989c98bc20", 6000000000n, 7))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-USD0++-USDC']

