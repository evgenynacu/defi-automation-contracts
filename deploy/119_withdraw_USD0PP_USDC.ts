import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromMorpho } from "../common/withdraw-from-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => withdrawFromMorpho(hre, "0x1eda1b67414336cab3914316cb58339ddaef9e43f939af1fed162a989c98bc20", 1, true))
	} else {
		await withdrawFromMorpho(hre, "0x1eda1b67414336cab3914316cb58339ddaef9e43f939af1fed162a989c98bc20", 1, false)
	}
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-USD0++-USDC']