import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sUSDe_ADDRESS, USDC} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"
import {Aave} from "../common/lending/aave";
import {withdraw} from "../common/withdraw";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const aave = new Aave(sUSDe_ADDRESS, USDC)
	await sendOrEstimate(hre, ex => withdraw({
		ex,
		lending: aave,
	}), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-sUSDe-AAVE']