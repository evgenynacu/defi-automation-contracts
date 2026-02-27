import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {withdrawFromAave} from "../common/withdraw-from-aave"
import {PT_srUSDE_2APR2026, sUSDe_ADDRESS, USDC, USDe_ADDRESS} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromAave(ex, PT_srUSDE_2APR2026, USDe_ADDRESS, 0.5, 1), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-srUSDe-APR26-USDe-AAVE']