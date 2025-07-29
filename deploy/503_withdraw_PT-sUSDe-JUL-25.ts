import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { withdrawFromAave } from "../common/withdraw-from-aave"
import { PT_eUSDe_AUG, PT_sUSDe_JUL, USDT_ADDRESS } from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromAave(ex, PT_sUSDe_JUL, USDT_ADDRESS, 1), "AaveSusdeJulVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-sUSDe-JUL-25-AAVE']