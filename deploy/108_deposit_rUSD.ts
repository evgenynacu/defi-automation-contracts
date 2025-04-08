import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToMorpho } from "./deposit-to-morpho"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => depositToMorpho(hre, "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e", 11596772959000000000000n, 20, true))
	} else {
		await depositToMorpho(hre, "0xc84cdb5a63207d8c2e7251f758a435c6bd10b4eaefdaf36d7650159bf035962e", 11596772959000000000000n, 20, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-rUSD']