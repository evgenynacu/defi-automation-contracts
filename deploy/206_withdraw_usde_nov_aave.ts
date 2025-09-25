import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {PT_USDe_NOV, USDC} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"
import {withdrawFromAave} from "../common/withdraw-from-aave";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => withdrawFromAave(ex, PT_USDe_NOV, USDC, 1), "AaveVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-USDe-NOV-25-AAVE']


