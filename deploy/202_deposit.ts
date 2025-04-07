import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToAave } from "./deposit-to-aave"
import { sUSDe_ADDRESS, USDT_ADDRESS } from "./addresses"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => depositToAave(hre, 5900000000n, sUSDe_ADDRESS, USDT_ADDRESS, 9, true))
	} else {
		await depositToAave(hre, 5900000000n, sUSDe_ADDRESS, USDT_ADDRESS, 9, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-aave-sUSDe']

