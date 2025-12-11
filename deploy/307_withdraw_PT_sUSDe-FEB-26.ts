import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {PT_sUSDe_FEB26, sUSDe_ADDRESS, USDC, USDe_ADDRESS} from "../common/addresses"
import {sendOrEstimate} from "./send-or-estimate"
import {Aave} from "../common/lending/aave";
import {withdraw} from "../common/withdraw";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const aave = new Aave(PT_sUSDe_FEB26, USDe_ADDRESS)
	await sendOrEstimate(hre, ex => withdraw({
		ex,
		lending: aave,
		collateralShare: 0.1,
		debtShare: 0.1,
	}), "AaveUsdcVaultProxy")
}

// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-sUSDe-FEB-26-AAVE']
// 66770.011804882551741836