import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => depositToMorpho(hre, "0x1eda1b67414336cab3914316cb58339ddaef9e43f939af1fed162a989c98bc20", 6000000000n, 7, true))
	} else {
		await depositToMorpho(hre, "0x1eda1b67414336cab3914316cb58339ddaef9e43f939af1fed162a989c98bc20", 6000000000n, 7, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-USD0++-USDC']

