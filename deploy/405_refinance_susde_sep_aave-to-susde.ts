import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {PT_sUSDe_SEP, sUSDe_ADDRESS, USDC} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"
import {refinance} from "../common/refinance"
import {Aave} from "../common/lending/aave"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`deploying contracts on network ${hre.network.name}`)

	const aaveFrom = new Aave(PT_sUSDe_SEP, USDC)
	const aaveTo = new Aave(sUSDe_ADDRESS, USDC)
	await sendOrEstimate(hre, ex => refinance(ex, aaveFrom, aaveTo, 1, 1, 10000000n), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['refinance-PT-sUSDe-SEP-25-aave-to-sUSDe']


