import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { depositToAave } from "../common/deposit-to-aave"
import { PT_sUSDe_SEP, USDT_ADDRESS } from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	await sendOrEstimate(hre, ex => depositToAave(ex, 39996000000n, PT_sUSDe_SEP, USDT_ADDRESS, 7.5), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['deposit-PT-sUSDe-SEP-25-AAVE']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)
//106425.517180592135428526 - 15000 * 6 * (1 + 0.05 * 71 / 365)
//(452336.016948506441393985 - 59349 * 6.5 * (1 + 0.06 * 68 / 365) - 59349) / 59349 * 365/68
//456408.367396323145700815 - 59994 * 6.5 (1 + 0.06 * 60/365)
