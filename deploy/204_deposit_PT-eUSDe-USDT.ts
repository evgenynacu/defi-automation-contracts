import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToAave } from "./deposit-to-aave"
import { PT_eUSDe_AUG, sUSDe_ADDRESS, USDT_ADDRESS } from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToAave(ex, 70000000000n, PT_eUSDe_AUG, USDT_ADDRESS, 7), "AaveVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-eUSDe-USDT']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)