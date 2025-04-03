import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromAave } from "./withdraw-from-aave"
import { sUSDe_ADDRESS, USDT_ADDRESS } from "./addresses"
import { estimateOutput } from "./estimate-output"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	if (process.env.DEBUG_ESTIMATE) {
		const debugEstimate = parseInt(process.env.DEBUG_ESTIMATE)
		await estimateOutput(debugEstimate * 1000, () => withdrawFromAave(hre, sUSDe_ADDRESS, USDT_ADDRESS, 1, true))
	} else {
		await withdrawFromAave(hre, sUSDe_ADDRESS, USDT_ADDRESS, 1, false)
	}
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-aave-sUSDe']