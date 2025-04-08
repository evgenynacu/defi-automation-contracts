import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => depositToMorpho(hre, "0xddac4d5caa0b1923ef338d53e01876af69c5b68ebf8e268082c7d3e2be2e7f8e", 6000000000n, 6.5, true))
	} else {
		await depositToMorpho(hre, "0xddac4d5caa0b1923ef338d53e01876af69c5b68ebf8e268082c7d3e2be2e7f8e", 2004010138835419948249n, 6.5, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-USD0-curve']