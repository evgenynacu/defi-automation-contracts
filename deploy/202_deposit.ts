import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToAave } from "../common/deposit-to-aave"
import { sUSDe_ADDRESS, USDT_ADDRESS } from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToAave(ex, 5900000000n, sUSDe_ADDRESS, USDT_ADDRESS, 9), "AaveVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-aave-sUSDe']

