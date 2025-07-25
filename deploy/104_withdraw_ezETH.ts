import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromCompound } from "../common/withdraw-from-compound"
import { COMET_WETH_ADDRESS, EZETH_ADDRESS } from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromCompound(ex, COMET_WETH_ADDRESS, EZETH_ADDRESS, 1))
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-ezETH']