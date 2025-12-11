import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {depositToAave} from "../common/deposit-to-aave"
import {PT_sUSDe_FEB26, USDe_ADDRESS} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToAave(ex, 44325000000000000000000n, PT_sUSDe_FEB26, USDe_ADDRESS, 8), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDe-FEB-26-AAVE']


//357987.744094690430863123 - 44325 * 7 * (1 + 0.04 * 55 / 365) - 44325 = 1517 = 22.7%