import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {withdrawFromAave} from "../common/withdraw-from-aave"
import {sUSDe_ADDRESS, USDC} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromAave(ex, sUSDe_ADDRESS, USDC, 1), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-sUSDe-AAVE']