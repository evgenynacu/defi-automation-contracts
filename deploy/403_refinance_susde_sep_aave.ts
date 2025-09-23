import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { PT_sUSDe_SEP, USDC, USDT_ADDRESS } from "../common/addresses"
import { sendOrEstimate } from "./send-or-estimate"
import { refinance } from "../common/refinance"
import { Aave } from "../common/lending/aave"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const aaveFrom = new Aave(PT_sUSDe_SEP, USDT_ADDRESS)
	const aaveTo = new Aave(PT_sUSDe_SEP, USDC)
	await sendOrEstimate(hre, ex => refinance(ex, aaveFrom, aaveTo, 1, 1, 10000000n), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-sUSDe-SEP-25-aave']


//498201.850976938564093206 - 420000 * (1 + 0.05 * 78 / 365)
//106425.517180592135428526 - 15000 * 6 * (1 + 0.05 * 71 / 365)

//0x0000000000000000000000000000000000000000000000000000000000000036 = 0x0000000000000000000000000000000000000000014adf4b7320334b90000000