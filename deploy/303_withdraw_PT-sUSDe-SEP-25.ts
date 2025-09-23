import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {PT_sUSDe_SEP, USDC} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"
import {Aave} from "../common/lending/aave";
import {withdraw} from "../common/withdraw";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const aave = new Aave(PT_sUSDe_SEP, USDC)
	await sendOrEstimate(hre, ex => withdraw(ex, aave, 1), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-sUSDe-SEP-25-AAVE']