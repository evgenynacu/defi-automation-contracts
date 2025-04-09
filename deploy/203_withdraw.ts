import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromAave } from "./withdraw-from-aave"
import { sUSDe_ADDRESS, USDT_ADDRESS } from "./addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromAave(ex, sUSDe_ADDRESS, USDT_ADDRESS, 1), "AaveVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-aave-sUSDe']