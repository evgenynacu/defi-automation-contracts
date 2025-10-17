import {HardhatRuntimeEnvironment} from 'hardhat/types'
import {DeployFunction} from 'hardhat-deploy/types'
import {sendOrEstimate} from "./send-or-estimate"
import {withdraw} from "../common/withdraw";
import {Morpho} from "../common/lending/morpho";
import {Euler} from "../common/lending/euler";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	console.log(`withdrawing on network ${hre.network.name}`)

	const collateralVault = "0x0391d9029713B1E9Ee1e241CB53D6BC89bAf299d" as const
	const debtVault = "0xe0a80d35bB6618CBA260120b279d357978c42BCE" as const

	const accountId = 2

	const euler = new Euler(collateralVault, debtVault, accountId)
	await sendOrEstimate(hre, ex => withdraw({ex, lending: euler}))
}
// noinspection JSUnusedGlobalSymbols
export default func
func.tags = ['withdraw-PT-tUSDe-DEC-25']